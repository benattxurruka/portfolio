import type { Gallery, GalleryType, GalleryWithPhotos, Photo } from "../r2/types";

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
          : "favourites";
        map.set(key, { type, photos: [] });
      }
      map.get(key)!.photos.push(photo);
    }
  }

  const galleries: Gallery[] = [];

  // Always show Favourites first
  if (map.has("favourites")) {
    const entry = map.get("favourites")!;
    galleries.push({
      id: "favourites",
      slug: "favourites",
      name: "My Favourites",
      description: "A curated selection of my best shots",
      type: "favourites",
      coverPhoto: entry.photos[0],
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
      coverPhoto: entry.photos[0],
      photoCount: entry.photos.length,
    });
  }

  // ── Fallback: "All Photos" for photos with no gallery membership ──────────
  // When objects in R2 have no x-amz-meta-galleries metadata every photo ends
  // up with galleries:[] and deriveGalleries would return an empty list.
  // Surface them under a synthetic "all" gallery so they're always visible.
  const assignedIds = new Set(galleries.flatMap((g) => g.id === "favourites" ? ["favourites"] : [`${g.type}/${g.slug}`]));
  const unassigned = photos.filter((p) => p.galleries.length === 0 || p.galleries.every((key) => !assignedIds.has(key)));

  if (unassigned.length > 0 && galleries.length === 0) {
    galleries.push({
      id: "all",
      slug: "all",
      name: options.allPhotosName ?? "All Photos",
      description: options.allPhotosDescription ?? "All photos in the collection",
      type: "themes",
      coverPhoto: unassigned[0],
      photoCount: unassigned.length,
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

  // Try trips first, then themes
  const tripsKey = `trips/${slug}`;
  const themesKey = `themes/${slug}`;

  return photos.filter(
    (p) => p.galleries.includes(tripsKey) || p.galleries.includes(themesKey)
  );
}

/**
 * Collect every unique tag across all photos, sorted alphabetically.
 */
export function deriveTags(photos: Photo[]): string[] {
  const set = new Set<string>();
  for (const photo of photos) {
    for (const tag of photo.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Return all photos that carry a specific tag.
 */
export function getPhotosByTag(photos: Photo[], tag: string): Photo[] {
  return photos.filter((p) => p.tags?.includes(tag));
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
