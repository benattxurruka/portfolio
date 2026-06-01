"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { PhotoGallery } from "./PhotoGallery";
import type { Photo, VoteMap } from "@/lib/r2/types";
import type { TagConfig } from "@/lib/utils/tagNormalization";
import { getTagLabel } from "@/lib/utils/tagNormalization";
import { deriveTags, getPhotosByTag } from "@/lib/utils/galleries";
import { cn } from "@/lib/utils/cn";

interface Props {
  photos: Photo[];
  gallerySlug: string;
  votes: VoteMap;
  /**
   * Tag that is always active and cannot be removed (used on the tag page where
   * the primary tag comes from the URL path, not the ?tags= param).
   */
  lockedTag?: string;
  tagConfig: TagConfig;
  locale: string;
}

// ── Inner component uses useSearchParams, must be inside Suspense ─────────────

function Inner({ photos, gallerySlug, votes, lockedTag, tagConfig, locale }: Props) {
  const t = useTranslations("Gallery");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Tags selected via ?tags= (comma-separated canonical slugs)
  const paramTags = useMemo(() => {
    const raw = searchParams.get("tags") ?? "";
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  // All active tags = locked (from URL path) + param tags, deduped
  const activeTags = useMemo(() => {
    const all = lockedTag ? [lockedTag, ...paramTags] : [...paramTags];
    return [...new Set(all)];
  }, [lockedTag, paramTags]);

  // Apply tags as AND filter
  const filteredPhotos = useMemo(() => {
    let result = photos;
    for (const tag of activeTags) {
      result = getPhotosByTag(result, tag, tagConfig);
    }
    return result;
  }, [photos, activeTags, tagConfig]);

  // Tags available in the current filtered result, excluding already-active ones
  const availableTags = useMemo(
    () => deriveTags(filteredPhotos, tagConfig).filter((tag) => !activeTags.includes(tag)),
    [filteredPhotos, tagConfig, activeTags]
  );

  function buildTagsUrl(newParamTags: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (newParamTags.length > 0) {
      params.set("tags", newParamTags.join(","));
    } else {
      params.delete("tags");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function addTag(tag: string) {
    router.push(buildTagsUrl([...paramTags, tag]), { scroll: false });
  }

  function removeTag(tag: string) {
    router.push(buildTagsUrl(paramTags.filter((t) => t !== tag)), { scroll: false });
  }

  function clearAll() {
    router.push(buildTagsUrl([]), { scroll: false });
  }

  const hasFilters = paramTags.length > 0;
  const showTagSection = activeTags.length > 0 || availableTags.length > 0;

  return (
    <>
      <PhotoGallery photos={filteredPhotos} gallerySlug={gallerySlug} votes={votes} />

      {showTagSection && (
        <div className="mt-8 space-y-3">
          {/* Active filter chips */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeTags.map((tag) => {
                const isLocked = tag === lockedTag;
                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                      "bg-accent/15 text-accent border-accent/30"
                    )}
                  >
                    <Tag className="w-3 h-3 shrink-0" />
                    {getTagLabel(tag, locale, tagConfig)}
                    {!isLocked && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-accent/60 transition-colors"
                        aria-label={`Remove filter: ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-xs text-ink-muted hover:text-ink-primary transition-colors px-1"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>
          )}

          {/* Available tags */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                             bg-surface-2 border border-border text-ink-muted
                             hover:border-accent/50 hover:text-ink-secondary transition-colors"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {getTagLabel(tag, locale, tagConfig)}
                </button>
              ))}
            </div>
          )}

          {/* Filtered count */}
          {hasFilters && (
            <p className="text-xs text-ink-muted">
              {t("photoCount", { count: filteredPhotos.length })}
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ── Public export wraps Inner in Suspense (required for useSearchParams) ──────

export function TagFilteredGallery(props: Props) {
  return (
    <Suspense fallback={
      <PhotoGallery photos={props.photos} gallerySlug={props.gallerySlug} votes={props.votes} />
    }>
      <Inner {...props} />
    </Suspense>
  );
}
