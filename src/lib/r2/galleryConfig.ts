import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BUCKET, getR2Client } from "./client";
import type { GalleryConfig } from "./types";

const CONFIG_KEY = "_config/galleries.json";

/**
 * Load gallery config from R2. Cached for 5 minutes, tagged "gallery-config".
 * Returns an empty object if the config object doesn't exist yet.
 */
export const getGalleryConfig = unstable_cache(
  async (): Promise<GalleryConfig> => {
    try {
      const client = getR2Client();
      const res = await client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: CONFIG_KEY })
      );
      const body = await res.Body?.transformToString();
      if (!body) return {};
      return JSON.parse(body) as GalleryConfig;
    } catch {
      // Object not found or parse error → start with empty config
      return {};
    }
  },
  ["gallery-config"],
  { revalidate: 300, tags: ["gallery-config"] }
);

/** Cookie name for a given gallery ID (safe for use in cookie names). */
export function galleryCookieName(galleryId: string): string {
  return `gallery_access_${galleryId.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

/** Persist the full gallery config to R2. */
export async function saveGalleryConfig(config: GalleryConfig): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: CONFIG_KEY,
      Body: JSON.stringify(config, null, 2),
      ContentType: "application/json",
    })
  );
}
