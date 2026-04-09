"use server";

import { revalidateTag } from "next/cache";
import { updatePhotoMetadata } from "@/lib/r2/updateMetadata";

export interface UpdatePhotoState {
  success?: boolean;
  error?: string;
}

export async function updatePhoto(
  _prev: UpdatePhotoState,
  formData: FormData
): Promise<UpdatePhotoState> {
  const r2Key = formData.get("r2Key") as string;
  if (!r2Key) return { error: "Missing r2Key" };

  const tags = (formData.get("tags") as string)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(",");

  const lat = (formData.get("lat") as string).trim();
  const lng = (formData.get("lng") as string).trim();

  try {
    await updatePhotoMetadata(r2Key, {
      title:       (formData.get("title") as string).trim() || undefined,
      description: (formData.get("description") as string).trim() || undefined,
      tags:        tags || undefined,
      location:    (formData.get("location") as string).trim() || undefined,
      galleries:   (formData.get("galleries") as string).trim() || undefined,
      lat:         lat || undefined,
      lng:         lng || undefined,
    });

    // Bust the cached photo list so changes show immediately.
    revalidateTag("r2-photos");

    return { success: true };
  } catch (err) {
    return { error: String(err) };
  }
}
