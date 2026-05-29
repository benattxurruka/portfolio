"use server";

import { revalidateTag } from "next/cache";

/**
 * Force-invalidates the cached photo list so the next request re-fetches
 * directly from R2. Use this after adding or deleting photos in the R2 bucket
 * without going through the admin UI (which revalidates automatically).
 */
export async function syncPhotoCache(): Promise<void> {
  revalidateTag("r2-photos");
}
