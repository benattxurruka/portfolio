"use server";

import { revalidateTag } from "next/cache";
import { saveSlideshowConfig } from "@/lib/r2/slideshowConfig";

export interface SlideshowActionState {
  success?: boolean;
  error?: string;
}

export async function updateSlideshow(
  _prev: SlideshowActionState,
  formData: FormData
): Promise<SlideshowActionState> {
  const raw = formData.get("keys") as string;
  if (!raw) return { error: "Missing keys." };

  let keys: string[];
  try {
    keys = JSON.parse(raw);
    if (!Array.isArray(keys) || keys.some((k) => typeof k !== "string")) {
      return { error: "Invalid payload." };
    }
  } catch {
    return { error: "Invalid JSON." };
  }

  try {
    await saveSlideshowConfig(keys);
    revalidateTag("slideshow-config");
    // Also bust the home page cache (it uses the slideshow config)
    revalidateTag("r2-photos");
    return { success: true };
  } catch (err) {
    return { error: String(err) };
  }
}
