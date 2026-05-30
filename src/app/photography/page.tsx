import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Tag } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getPhotos } from "@/lib/r2/photos";
import { getTagConfig } from "@/lib/r2/tagConfig";
import { deriveGalleries, deriveTags } from "@/lib/utils/galleries";
import { mergeTagConfig, getTagLabel } from "@/lib/utils/tagNormalization";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { recordPageView } from "@/lib/otel/metrics";

export const metadata: Metadata = {
  title: "Photography Gallery",
};

export const revalidate = 300;

export default async function PhotographyPage() {
  try { recordPageView("photography"); } catch {}
  const [photos, t, locale, r2TagConfig] = await Promise.all([
    getPhotos(),
    getTranslations("Photography"),
    getLocale(),
    getTagConfig(),
  ]);

  const tagConfig = mergeTagConfig(r2TagConfig);
  const tags = deriveTags(photos, tagConfig);
  const galleries = deriveGalleries(photos, {
    allPhotosName: t("allPhotosName"),
    allPhotosDescription: t("allPhotosDescription"),
  });
  const favourites = galleries.filter((g) => g.type === "favourites");
  const places = galleries.filter((g) => g.type === "places");
  const themes = galleries.filter((g) => g.type === "themes");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
            <Camera className="w-6 h-6 text-ink-secondary" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-primary">
            {t("title")}
          </h1>
        </div>
        <p className="text-ink-secondary ml-14">
          {t("summary", { photoCount: photos.length, galleryCount: galleries.length })}
        </p>
      </div>

      {favourites.length > 0 && (
        <section className="mb-12">
          <GalleryGrid galleries={favourites} featured />
        </section>
      )}

      {places.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-widest mb-5">
            {t("byPlace")}
          </h2>
          <GalleryGrid galleries={places} />
        </section>
      )}

      {themes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-widest mb-5">
            {t("byTheme")}
          </h2>
          <GalleryGrid galleries={themes} />
        </section>
      )}

      {tags.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-widest mb-5 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" />
            {t("byTag")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/photography/tag/${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                           bg-surface-2 border border-border text-ink-secondary
                           hover:border-accent hover:text-accent transition-colors"
              >
                <Tag className="w-3 h-3" />
                {getTagLabel(tag, locale, tagConfig)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {galleries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-ink-muted">
          <Camera className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg">{t("emptyHeading")}</p>
          <p className="text-sm mt-1">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
