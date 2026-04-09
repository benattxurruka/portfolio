import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, getR2Client } from "./client";
import type { VoteMap } from "./types";

const VOTES_KEY = "_data/votes.json";

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function getVotes(): Promise<VoteMap> {
  try {
    const client = getR2Client();
    const response = await client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: VOTES_KEY })
    );
    if (!response.Body) return {};
    const text = await streamToString(response.Body as NodeJS.ReadableStream);
    return JSON.parse(text) as VoteMap;
  } catch (err) {
    console.warn("[r2/votes] Could not fetch votes.json — returning empty map:", err);
    return {};
  }
}

async function writeVotes(votes: VoteMap): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: VOTES_KEY,
      Body: JSON.stringify(votes, null, 2),
      ContentType: "application/json",
    })
  );
}

export async function incrementVote(photoId: string): Promise<number> {
  const votes = await getVotes();
  const newCount = (votes[photoId] ?? 0) + 1;
  votes[photoId] = newCount;
  await writeVotes(votes);
  return newCount;
}

export async function decrementVote(photoId: string): Promise<number> {
  const votes = await getVotes();
  const newCount = Math.max(0, (votes[photoId] ?? 0) - 1);
  votes[photoId] = newCount;
  await writeVotes(votes);
  return newCount;
}
