import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { getPhotos } from "@/lib/r2/photos";
import { getVotes } from "@/lib/r2/votes";
import { getTagConfig } from "@/lib/r2/tagConfig";
import { getGalleryConfig } from "@/lib/r2/galleryConfig";
import { resolveGallery } from "@/lib/utils/galleries";
import { mergeTagConfig } from "@/lib/utils/tagNormalization";
import { TagFilteredGallery } from "@/components/photography/TagFilteredGallery";
import { PrivateGalleryGate } from "@/components/photography/PrivateGalleryGate";
import { galleryCookieName } from "@/lib/r2/galleryConfig";
import { headers } from "next/headers";
import { recordPageView } from "@/lib/otel/metrics";

interface Props {
  params: Promise<{ gallery: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gallery: slug } = await params;
  const [photos, galleryConfig] = await Promise.all([getPhotos(), getGalleryConfig()]);
  const gallery = resolveGallery(photos, slug, galleryConfig);
  // Don't reveal name/description for private galleries in meta
  if (gallery?.isPrivate) return { title: "Private Gallery" };
  return {
    title: gallery?.name ?? "Gallery",
    description: gallery?.description,
  };
}

export default async function GalleryPage({ params }: Props) {
  const { gallery: slug } = await params;
  const country = (await headers()).get("x-vercel-ip-country") ?? undefined;
  try { recordPageView(`gallery/${slug}`, country); } catch {}

  const [photos, votes, t, locale, r2TagConfig, galleryConfig] = await Promise.all([
    getPhotos(),
    getVotes(),
    getTranslations("Gallery"),
    getLocale(),
    getTagConfig(),
    getGalleryConfig(),
  ]);

  const gallery = resolveGallery(photos, slug, galleryConfig);
  if (!gallery) notFound();

  // ── Private gallery access gate ─────────────────────────────────────────
  if (gallery.isPrivate) {
    const configEntry = galleryConfig[gallery.id];
    const jar = await cookies();
    const sessionCookie = jar.get(galleryCookieName(gallery.id))?.value;
    const isUnlocked =
      configEntry?.passwordHash && sessionCookie === configEntry.passwordHash;

    if (!isUnlocked) {
      return (
        <PrivateGalleryGate
          galleryId={gallery.id}
          gallerySlug={slug}
          galleryName={gallery.name}
        />
      );
    }
  }

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
