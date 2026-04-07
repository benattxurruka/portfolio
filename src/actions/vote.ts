"use server";

import { incrementVote } from "@/lib/r2/votes";
import { recordPhotoVote } from "@/lib/otel/metrics";
import { logger } from "@/lib/otel/logger";

interface VoteResult {
  success: boolean;
  newCount?: number;
  error?: string;
}

export async function voteForPhoto(
  photoId: string,
  gallerySlug: string
): Promise<VoteResult> {
  if (!photoId || typeof photoId !== "string") {
    return { success: false, error: "Invalid photo ID" };
  }

  try {
    const newCount = await incrementVote(photoId);

    // Record OTel metric — fire-and-forget (do not fail the action if it throws)
    try {
      recordPhotoVote(photoId, gallerySlug);
    } catch (metricErr) {
      logger.warn("[vote] Failed to record OTel metric", {
        photo_id: photoId,
        error: String(metricErr),
      });
    }

    logger.info("[vote] Vote recorded", {
      photo_id: photoId,
      gallery: gallerySlug,
      new_count: newCount,
    });

    return { success: true, newCount };
  } catch (err) {
    logger.error("[vote] Failed to increment vote", {
      photo_id: photoId,
      error: String(err),
    });
    return { success: false, error: "Failed to record vote" };
  }
}
