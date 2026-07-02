import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BUCKET, getR2Client } from "./client";

const CONFIG_KEY = "_config/slideshow.json";

/**
 * Ordered list of r2Keys to show in the home page slideshow.
 * Cached for 5 minutes, tagged "slideshow-config".
 * Returns null if not yet configured (caller falls back to favourites gallery).
 */
export const getSlideshowConfig = unstable_cache(
  async (): Promise<string[] | null> => {
    try {
      const client = getR2Client();
      const res = await client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: CONFIG_KEY })
      );
      const body = await res.Body?.transformToString();
      if (!body) return null;
      const parsed = JSON.parse(body);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  ["slideshow-config"],
  { revalidate: 300, tags: ["slideshow-config"] }
);

/** Persist the ordered r2Key list to R2. */
export async function saveSlideshowConfig(keys: string[]): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: CONFIG_KEY,
      Body: JSON.stringify(keys),
      ContentType: "application/json",
    })
  );
}
