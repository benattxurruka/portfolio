import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getPhotos } from "@/lib/r2/photos";
import { getVotes } from "@/lib/r2/votes";
import { getTagConfig } from "@/lib/r2/tagConfig";
import { resolveGallery } from "@/lib/utils/galleries";
import { mergeTagConfig } from "@/lib/utils/tagNormalization";
import { TagFilteredGallery } from "@/components/photography/TagFilteredGallery";
import { recordPageView } from "@/lib/otel/metrics";

export const revalidate = 300;

interface Props {
  params: Promise<{ gallery: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gallery: slug } = await params;
  const photos = await getPhotos();
  const gallery = resolveGallery(photos, slug);
  return {
    title: gallery?.name ?? "Gallery",
    description: gallery?.description,
  };
}

export default async function GalleryPage({ params }: Props) {
  const { gallery: slug } = await params;
  try { recordPageView(`gallery/${slug}`); } catch {}

  const [photos, votes, t, locale, r2TagConfig] = await Promise.all([
    getPhotos(),
    getVotes(),
    getTranslations("Gallery"),
    getLocale(),
    getTagConfig(),
  ]);

  const gallery = resolveGallery(photos, slug);
  if (!gallery) notFound();

  const tagConfig = mergeTagConfig(r2TagConfig);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link
        href="/photography"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary
                   transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backLink")}
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Images className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-semibold text-ink-primary">
            {gallery.name}
          </h1>
        </div>
        <p className="text-ink-secondary text-sm ml-8">{gallery.description}</p>
        <p className="text-ink-muted text-sm mt-1 ml-8">
          {t("photoCount", { count: gallery.photoCount })}
        </p>
      </div>

      <TagFilteredGallery
        photos={gallery.photos}
        gallerySlug={slug}
        votes={votes}
        tagConfig={tagConfig}
        locale={locale}
      />
    </div>
  );
}
