import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BUCKET, getR2Client } from "./client";

const MESSAGES_KEY = "_data/messages.json";

export interface Message {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  read: boolean;
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function getMessages(): Promise<Message[]> {
  try {
    const client = getR2Client();
    const response = await client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: MESSAGES_KEY })
    );
    if (!response.Body) return [];
    const text = await streamToString(response.Body as NodeJS.ReadableStream);
    return JSON.parse(text) as Message[];
  } catch (err) {
    console.warn("[r2/messages] Could not fetch messages.json — returning empty array:", err);
    return [];
  }
}

export const getCachedMessages = unstable_cache(getMessages, ["messages"], {
  revalidate: 60,
  tags: ["messages"],
});

async function writeMessages(messages: Message[]): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: MESSAGES_KEY,
      Body: JSON.stringify(messages, null, 2),
      ContentType: "application/json",
    })
  );
}

export async function saveMessage(
  msg: Omit<Message, "id" | "createdAt" | "read">
): Promise<Message> {
  const messages = await getMessages();
  const newMessage: Message = {
    ...msg,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    read: false,
  };
  messages.push(newMessage);
  await writeMessages(messages);
  return newMessage;
}

export async function markRead(id: string): Promise<void> {
  const messages = await getMessages();
  const updated = messages.map((m) => (m.id === id ? { ...m, read: true } : m));
  await writeMessages(updated);
}
