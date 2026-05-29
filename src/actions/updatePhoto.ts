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

  // S3/R2 metadata headers are ASCII-only. Encode non-ASCII characters so that
  // accents, ñ, etc. survive the round-trip. Decoded back in lib/r2/photos.ts.
  const enc = encodeURIComponent;

  // List fields: encode each item individually so the comma separator is preserved.
  const encList = (raw: string) =>
    raw.split(",").map((v) => enc(v.trim())).filter(Boolean).join(",");

  const tags    = encList(formData.get("tags")    as string);
  const coverFor = encList(formData.get("coverFor") as string);
  const galleries = encList((formData.get("galleries") as string).trim());

  const lat = (formData.get("lat") as string).trim();
  const lng = (formData.get("lng") as string).trim();

  try {
    await updatePhotoMetadata(r2Key, {
      title:       enc((formData.get("title")       as string).trim()) || undefined,
      description: enc((formData.get("description") as string).trim()) || undefined,
      location:    enc((formData.get("location")    as string).trim()) || undefined,
      tags:        tags     || undefined,
      galleries:   galleries || undefined,
      "cover-for": coverFor || undefined,
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
