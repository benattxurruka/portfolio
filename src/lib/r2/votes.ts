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

/**
 * Atomically increment the vote count for a photo.
 *
 * Note: R2 does not support conditional writes, so at very high concurrency
 * two simultaneous increments could cause a lost update. For a personal
 * portfolio this is an acceptable trade-off.
 */
export async function incrementVote(photoId: string): Promise<number> {
  const client = getR2Client();
  const votes = await getVotes();
  const newCount = (votes[photoId] ?? 0) + 1;
  votes[photoId] = newCount;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: VOTES_KEY,
      Body: JSON.stringify(votes, null, 2),
      ContentType: "application/json",
    })
  );

  return newCount;
}
