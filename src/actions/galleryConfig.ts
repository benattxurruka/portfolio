"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getGalleryConfig, saveGalleryConfig, galleryCookieName } from "@/lib/r2/galleryConfig";

export interface GalleryActionState {
  success?: boolean;
  error?: string;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}


/**
 * Create or update a gallery config entry.
 * galleryId: the gallery key, e.g. "places/japan-2024" or "boda-marc-anna"
 */
export async function upsertGallery(
  _prev: GalleryActionState,
  formData: FormData
): Promise<GalleryActionState> {
  const galleryId = (formData.get("galleryId") as string).trim();
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim();
  const isPrivate = formData.get("private") === "true";
  const password = ((formData.get("password") as string) ?? "").trim();

  if (!galleryId) return { error: "Gallery ID is required." };
  if (!name) return { error: "Display name is required." };

  try {
    const config = await getGalleryConfig();
    const existing = config[galleryId] ?? {};

    const entry: typeof existing = {
      ...existing,
      name,
      description: description || undefined,
      private: isPrivate,
    };

    if (isPrivate) {
      if (password) {
        entry.passwordHash = await hashPassword(password);
      } else if (!existing.passwordHash) {
        return { error: "A password is required for private galleries." };
      }
      // No new password + existing hash → keep existing hash (already spread above)
    } else {
      delete entry.passwordHash;
    }

    config[galleryId] = entry;
    await saveGalleryConfig(config);
    revalidateTag("gallery-config");
    return { success: true };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Remove a gallery config entry.
 * Does NOT delete photos — galleries derived from photos will still appear,
 * just without any config overrides.
 */
export async function deleteGallery(
  _prev: GalleryActionState,
  formData: FormData
): Promise<GalleryActionState> {
  const galleryId = formData.get("galleryId") as string;
  if (!galleryId) return { error: "Missing galleryId." };

  try {
    const config = await getGalleryConfig();
    delete config[galleryId];
    await saveGalleryConfig(config);
    revalidateTag("gallery-config");
    return { success: true };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Validate the password for a private gallery and set an access cookie.
 * On success redirects back to the gallery page.
 */
export async function unlockGallery(
  _prev: GalleryActionState,
  formData: FormData
): Promise<GalleryActionState> {
  const galleryId = (formData.get("galleryId") as string).trim();
  const gallerySlug = (formData.get("gallerySlug") as string).trim();
  const password = ((formData.get("password") as string) ?? "").trim();

  if (!galleryId || !gallerySlug) return { error: "Missing gallery information." };
  if (!password) return { error: "Password is required." };

  const config = await getGalleryConfig();
  const entry = config[galleryId];

  if (!entry?.private || !entry.passwordHash) {
    return { error: "This gallery is not private." };
  }

  const hash = await hashPassword(password);
  if (hash !== entry.passwordHash) {
    return { error: "Incorrect password. Please try again." };
  }

  const jar = await cookies();
  jar.set(galleryCookieName(galleryId), hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect(`/photography/${gallerySlug}`);
}
