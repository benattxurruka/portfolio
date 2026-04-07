import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPhotos } from "@/lib/r2/photos";
import { deriveGalleries } from "@/lib/utils/galleries";
import { GalleryGrid } from "@/components/photography/GalleryGrid";
import { recordPageView } from "@/lib/otel/metrics";

export const metadata: Metadata = {
  title: "Photography Gallery",
};

export const revalidate = 300;

export default async function PhotographyPage() {
  try { recordPageView("photography"); } catch {}
  const [photos, t] = await Promise.all([getPhotos(), getTranslations("Photography")]);

  const galleries = deriveGalleries(photos, {
    allPhotosName: t("allPhotosName"),
    allPhotosDescription: t("allPhotosDescription"),
  });
  const favourites = galleries.filter((g) => g.type === "favourites");
  const trips = galleries.filter((g) => g.type === "trips");
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

      {trips.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-widest mb-5">
            {t("byTrip")}
          </h2>
          <GalleryGrid galleries={trips} />
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
