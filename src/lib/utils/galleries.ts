import type { Gallery, GalleryType, GalleryWithPhotos, Photo } from "../r2/types";
import { normalizeTag, getTagVariants, type TagConfig } from "./tagNormalization";

/**
 * Pretty-print a slug like "japan-2024" → "Japan 2024"
 */
function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Derive all galleries from a flat list of photos.
 *
 * Gallery key format in photo.galleries:
 *   "favourites"
 *   "trips/{slug}"    e.g. "trips/japan-2024"
 *   "themes/{slug}"   e.g. "themes/cityscape"
 */
interface DeriveGalleriesOptions {
  allPhotosName?: string;
  allPhotosDescription?: string;
}

export function deriveGalleries(photos: Photo[], options: DeriveGalleriesOptions = {}): Gallery[] {
  const map = new Map<string, { type: GalleryType; photos: Photo[] }>();

  for (const photo of photos) {
    for (const key of photo.galleries) {
      if (!map.has(key)) {
        const type: GalleryType = key.startsWith("trips/")
          ? "trips"
          : key.startsWith("themes/")
          ? "themes"
          : key === "favourites"
          ? "favourites"
          : "trips"; // plain folder key (e.g. "japan-2024") → trips by default
        map.set(key, { type, photos: [] });
      }
      map.get(key)!.photos.push(photo);
    }
  }

  const galleries: Gallery[] = [];

  /** Pick the designated cover photo for a gallery, falling back to the first photo. */
  function pickCover(key: string, slug: string, photos: Photo[]): Photo | undefined {
    return (
      photos.find((p) => p.coverFor?.includes(key) || p.coverFor?.includes(slug)) ??
      photos[0]
    );
  }

  // Always show Favourites first
  if (map.has("favourites")) {
    const entry = map.get("favourites")!;
    galleries.push({
      id: "favourites",
      slug: "favourites",
      name: "My Favourites",
      description: "A curated selection of my best shots",
      type: "favourites",
      coverPhoto: pickCover("favourites", "favourites", entry.photos),
      photoCount: entry.photos.length,
    });
    map.delete("favourites");
  }

  // Then trips, then themes — sorted alphabetically within each group
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [key, entry] of sorted) {
    const parts = key.split("/");
    const slug = parts[parts.length - 1];
    const name = prettifySlug(slug);

    galleries.push({
      id: key,
      slug,
      name,
      description:
        entry.type === "trips"
          ? `Photos from ${name}`
          : `${name} photography`,
      type: entry.type,
      coverPhoto: pickCover(key, slug, entry.photos),
      photoCount: entry.photos.length,
    });
  }

  // ── "All Photos" gallery — always present ────────────────────────────────
  // Shown regardless of whether other galleries exist, so visitors always have
  // a single place to browse every photo in the collection.
  if (photos.length > 0) {
    galleries.push({
      id: "all",
      slug: "all",
      name: options.allPhotosName ?? "All Photos",
      description: options.allPhotosDescription ?? "All photos in the collection",
      type: "themes",
      coverPhoto: photos[0],
      photoCount: photos.length,
    });
  }

  return galleries;
}

/**
 * Get the photos for a specific gallery slug (e.g. "japan-2024", "favourites").
 */
export function getGalleryPhotos(photos: Photo[], slug: string): Photo[] {
  if (slug === "all") {
    return photos;
  }

  if (slug === "favourites") {
    return photos.filter((p) => p.galleries.includes("favourites"));
  }

  // Match typed keys (trips/slug, themes/slug) and plain folder keys (slug)
  const tripsKey = `trips/${slug}`;
  const themesKey = `themes/${slug}`;

  return photos.filter(
    (p) =>
      p.galleries.includes(tripsKey) ||
      p.galleries.includes(themesKey) ||
      p.galleries.includes(slug) // plain folder key, e.g. "japan-2024"
  );
}

/**
 * Collect every unique canonical tag across all photos.
 * Raw tags from R2 (any language) are normalised to their canonical slug so that
 * multilingual variants of the same concept (e.g. "Catalunya", "Cataluña", "Catalonia")
 * are merged into a single entry. Sorted by frequency desc, then alphabetically.
 */
export function deriveTags(photos: Photo[], tagConfig?: TagConfig): string[] {
  const counts = new Map<string, number>();
  for (const photo of photos) {
    for (const rawTag of photo.tags ?? []) {
      const canonical = normalizeTag(rawTag, tagConfig);
      counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
    }
  }
  return [...counts.keys()].sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b)
  );
}

/**
 * Return all photos that carry a specific canonical tag.
 * Matches any registered variant (case-insensitive) or any raw tag that
 * normalises to the same canonical slug.
 */
export function getPhotosByTag(
  photos: Photo[],
  canonicalTag: string,
  tagConfig?: TagConfig
): Photo[] {
  const lowerVariants = new Set(
    getTagVariants(canonicalTag, tagConfig).map((v) => v.toLowerCase())
  );
  return photos.filter((p) =>
    p.tags?.some(
      (t) =>
        lowerVariants.has(t.toLowerCase()) ||
        normalizeTag(t, tagConfig) === canonicalTag
    )
  );
}

/**
 * Resolve a slug to a full Gallery object (with photos attached).
 */
export function resolveGallery(
  photos: Photo[],
  slug: string
): GalleryWithPhotos | null {
  const galleries = deriveGalleries(photos);
  const gallery = galleries.find((g) => g.slug === slug);
  if (!gallery) return null;

  return {
    ...gallery,
    photos: getGalleryPhotos(photos, slug),
  };
}
