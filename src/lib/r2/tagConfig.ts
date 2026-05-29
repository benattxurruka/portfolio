import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BUCKET, getR2Client } from "./client";
import type { TagConfig } from "@/lib/utils/tagNormalization";

const CONFIG_KEY = "_config/tag-translations.json";

/**
 * Load tag config from R2. Cached for 5 minutes, tagged "tag-config".
 * Returns an empty object if the config object doesn't exist yet.
 */
export const getTagConfig = unstable_cache(
  async (): Promise<TagConfig> => {
    try {
      const client = getR2Client();
      const res = await client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: CONFIG_KEY })
      );
      const body = await res.Body?.transformToString();
      if (!body) return {};
      return JSON.parse(body) as TagConfig;
    } catch {
      // Object not found or parse error → start with empty config
      return {};
    }
  },
  ["tag-config"],
  { revalidate: 300, tags: ["tag-config"] }
);

/** Persist the full tag config to R2. */
export async function saveTagConfig(config: TagConfig): Promise<void> {
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
