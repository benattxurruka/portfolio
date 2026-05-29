"use server";

import { revalidateTag } from "next/cache";
import { getTagConfig, saveTagConfig } from "@/lib/r2/tagConfig";

export interface TagActionState {
  success?: boolean;
  error?: string;
}

/** Add or update a canonical tag entry in the R2 config. */
export async function upsertTag(
  _prev: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  const rawCanonical = (formData.get("canonical") as string ?? "").trim();
  const canonical = rawCanonical.toLowerCase().replace(/\s+/g, "-");

  if (!canonical) return { error: "Canonical slug is required." };

  const rawVariants = (formData.get("variants") as string ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (rawVariants.length === 0) return { error: "At least one variant is required." };

  const translations: Record<string, string> = {};
  for (const locale of ["en", "es", "ca", "eu"]) {
    const val = ((formData.get(`translation_${locale}`) as string) ?? "").trim();
    if (val) translations[locale] = val;
  }

  try {
    const config = await getTagConfig();
    config[canonical] = { variants: rawVariants, translations };
    await saveTagConfig(config);
    revalidateTag("tag-config");
    revalidateTag("r2-photos");
    return { success: true };
  } catch (err) {
    return { error: String(err) };
  }
}

/** Delete a canonical tag entry from the R2 config. */
export async function deleteTag(
  _prev: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  const canonical = (formData.get("canonical") as string ?? "").trim();
  if (!canonical) return { error: "Missing canonical slug." };

  try {
    const config = await getTagConfig();
    delete config[canonical];
    await saveTagConfig(config);
    revalidateTag("tag-config");
    revalidateTag("r2-photos");
    return { success: true };
  } catch (err) {
    return { error: String(err) };
  }
}
