"use server";

import { headers } from "next/headers";
import { recordPhotoView, recordPhotoViewDuration } from "@/lib/otel/metrics";
import { logger } from "@/lib/otel/logger";

export async function recordView(
  photoId: string,
  gallerySlug: string
): Promise<void> {
  try {
    const country = (await headers()).get("x-vercel-ip-country") ?? undefined;
    recordPhotoView(photoId, gallerySlug, country);
  } catch (err) {
    logger.warn("[view] Failed to record view metric", {
      photo_id: photoId,
      error: String(err),
    });
  }
}

export async function recordViewDuration(
  photoId: string,
  durationSeconds: number
): Promise<void> {
  try {
    recordPhotoViewDuration(photoId, durationSeconds);
  } catch (err) {
    logger.warn("[view] Failed to record view duration metric", {
      photo_id: photoId,
      error: String(err),
    });
  }
}
