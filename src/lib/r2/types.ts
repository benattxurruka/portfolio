// ---------------------------------------------------------------------------
// Photo & Gallery domain types
// ---------------------------------------------------------------------------

export interface Photo {
  id: string;
  /** Path inside the R2 bucket, e.g. "photos/japan-2024/shinjuku.jpg" */
  r2Key: string;
  title: string;
  description?: string;
  /** ISO date string, e.g. "2024-03-15" */
  takenAt?: string;
  location?: string;
  /**
   * Gallery membership IDs.
   * A photo can belong to multiple galleries; the actual gallery definitions
   * are derived at runtime from these keys. Format:
   *   - "favourites"
   *   - "places/{slug}"  e.g. "places/japan-2024"
   *   - "themes/{slug}" e.g. "themes/cityscape"
   */
  galleries: string[];
  /** Free-form tags, e.g. ["landscape", "golden-hour", "long-exposure"] */
  tags?: string[];
  /**
   * Gallery IDs for which this photo is the designated cover image.
   * Matched against gallery id or slug during deriveGalleries.
   * e.g. ["japan-2024", "favourites"]
   */
  coverFor?: string[];
  /** GPS latitude in decimal degrees (e.g. 43.2630) */
  lat?: number;
  /** GPS longitude in decimal degrees (e.g. -2.9350) */
  lng?: number;
  width?: number;
  height?: number;
}

export interface VoteMap {
  [photoId: string]: number;
}

// ---------------------------------------------------------------------------
// Derived gallery types (computed from photos at runtime)
// ---------------------------------------------------------------------------

export type GalleryType = "favourites" | "places" | "themes";

export interface Gallery {
  id: string;
  /** URL-safe slug, matches the last segment of the gallery key */
  slug: string;
  /** Human-readable display name */
  name: string;
  description: string;
  type: GalleryType;
  coverPhoto?: Photo;
  photoCount: number;
}

export interface GalleryWithPhotos extends Gallery {
  photos: Photo[];
}

// ---------------------------------------------------------------------------
// GitHub types
// ---------------------------------------------------------------------------

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  visibility: string;
}
