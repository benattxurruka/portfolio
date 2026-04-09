import {
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BUCKET, getR2Client } from "./client";
import { logger } from "@/lib/otel/logger";
import type { Photo } from "./types";

const PHOTOS_PREFIX = "";
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

/**
 * Discover every photo in the R2 bucket and build Photo objects from their
 * custom metadata headers.
 *
 * Metadata you set on each object at upload time (via the R2 dashboard,
 * Workers, or the S3-compatible API):
 *
 *   x-amz-meta-title        Human-readable title
 *   x-amz-meta-description  Optional caption
 *   x-amz-meta-taken-at     ISO date, e.g. "2024-03-15"
 *   x-amz-meta-location     e.g. "Tokyo, Japan"
 *   x-amz-meta-galleries    Comma-separated keys:
 *                              "favourites,trips/japan-2024,themes/cityscape"
 *   x-amz-meta-width        Pixel width  (optional, for aspect-ratio hints)
 *   x-amz-meta-height       Pixel height (optional)
 *
 * The photo id is the object key with the "photos/" prefix stripped.
 * Example: "photos/japan-2024/shinjuku.jpg" → id "japan-2024/shinjuku.jpg"
 */
async function fetchPhotosFromR2(): Promise<Photo[]> {
  logger.info("[r2] fetchPhotosFromR2 start", { bucket: BUCKET, prefix: PHOTOS_PREFIX });

  const client = getR2Client();

  // ── 1. List every image key under photos/ (handles pagination) ──────────
  const keys: string[] = [];
  let token: string | undefined;
  let page = 0;

  try {
    do {
      page++;
      logger.info("[r2] ListObjectsV2 request", { bucket: BUCKET, prefix: PHOTOS_PREFIX, page });

      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: PHOTOS_PREFIX,
          ContinuationToken: token,
        })
      );

      const pageKeys = (res.Contents ?? []).filter((o) => o.Key && IMAGE_RE.test(o.Key)).map((o) => o.Key!);
      keys.push(...pageKeys);

      logger.info("[r2] ListObjectsV2 response", {
        page,
        objectsInPage: res.Contents?.length ?? 0,
        imageKeysInPage: pageKeys.length,
        isTruncated: res.IsTruncated ?? false,
      });

      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
  } catch (err) {
    logger.error("[r2] ListObjectsV2 failed", { error: String(err) });
    return [];
  }

  logger.info("[r2] listing complete", { totalImageKeys: keys.length });

  if (keys.length === 0) return [];

  // ── 2. Read per-object metadata in parallel ──────────────────────────────
  const results = await Promise.allSettled(
    keys.map(async (key): Promise<Photo> => {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: key })
      );

      const m = head.Metadata ?? {};
      const id = key.slice(PHOTOS_PREFIX.length);

      return {
        id,
        r2Key: key,
        title:       m["title"]       ?? id,
        description: m["description"] ?? undefined,
        takenAt:     m["taken-at"]    ?? undefined,
        location:    m["location"]    ?? undefined,
        galleries:   m["galleries"]
          ? m["galleries"].split(",").map((g) => g.trim()).filter(Boolean)
          : [],
        tags: m["tags"]
          ? m["tags"].split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
        lat: m["lat"] ? parseFloat(m["lat"]) : undefined,
        lng: m["lng"] ? parseFloat(m["lng"]) : undefined,
        width:  m["width"]  ? parseInt(m["width"],  10) : undefined,
        height: m["height"] ? parseInt(m["height"], 10) : undefined,
      };
    })
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    logger.warn("[r2] some HeadObject calls failed", {
      failed: failed.length,
      total: keys.length,
      firstError: String((failed[0] as PromiseRejectedResult).reason),
    });
  }

  const photos = results
    .filter((r): r is PromiseFulfilledResult<Photo> => r.status === "fulfilled")
    .map((r) => r.value);

  logger.info("[r2] fetchPhotosFromR2 done", { photoCount: photos.length });
  return photos;
}

/**
 * Cached version of fetchPhotosFromR2.
 * Next.js revalidates every 5 minutes; the raw API calls are never made
 * on every request.
 */
export const getPhotos = unstable_cache(fetchPhotosFromR2, ["r2-photos"], {
  revalidate: 300,
  tags: ["r2-photos"],
});

/**
 * Build the public URL for a photo from the R2_PUBLIC_URL env variable.
 */
export function getPhotoUrl(r2Key: string): string {
  // NEXT_PUBLIC_R2_PUBLIC_URL is available on both server and client.
  // R2_PUBLIC_URL is server-only fallback (no NEXT_PUBLIC_ prefix = not sent to browser).
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? "";
  // Encode each path segment so filenames with spaces or special characters
  // produce a valid URL (e.g. "Irati2  21x30.jpg" → "Irati2%2021x30.jpg").
  const encoded = r2Key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encoded}`;
}
