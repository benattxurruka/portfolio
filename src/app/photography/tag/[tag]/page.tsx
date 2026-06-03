import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getPhotos } from "@/lib/r2/photos";
import { getVotes } from "@/lib/r2/votes";
import { getTagConfig } from "@/lib/r2/tagConfig";
import { deriveTags, getPhotosByTag } from "@/lib/utils/galleries";
import { normalizeTag, mergeTagConfig, getTagLabel } from "@/lib/utils/tagNormalization";
import { TagFilteredGallery } from "@/components/photography/TagFilteredGallery";
import { headers } from "next/headers";
import { recordPageView } from "@/lib/otel/metrics";

export const revalidate = 300;

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded}`,
    description: `Photos tagged with "${decoded}"`,
  };
}

export default async function TagGalleryPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  const [photos, votes, t, locale, r2TagConfig] = await Promise.all([
    getPhotos(),
    getVotes(),
    getTranslations("Gallery"),
    getLocale(),
    getTagConfig(),
  ]);

  const tagConfig = mergeTagConfig(r2TagConfig);

  // Redirect old or multilingual variant URLs to the canonical slug
  // e.g. /photography/tag/Catalunya → /photography/tag/catalonia
  const canonical = normalizeTag(decoded, tagConfig);
  if (canonical !== decoded) {
    redirect(`/photography/tag/${encodeURIComponent(canonical)}`);
  }

  const country = (await headers()).get("x-vercel-ip-country") ?? undefined;
  try { recordPageView(`tag/${canonical}`, country); } catch {}

  const allTags = deriveTags(photos, tagConfig);
  if (!allTags.includes(canonical)) notFound();

  const taggedPhotos = getPhotosByTag(photos, canonical, tagConfig);

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
          <Tag className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-semibold text-ink-primary">#{getTagLabel(canonical, locale, tagConfig)}</h1>
        </div>
        <p className="text-ink-muted text-sm mt-1 ml-8">
          {t("photoCount", { count: taggedPhotos.length })}
        </p>
      </div>

      <TagFilteredGallery
        photos={taggedPhotos}
        gallerySlug={`tag/${canonical}`}
        votes={votes}
        lockedTag={canonical}
        tagConfig={tagConfig}
        locale={locale}
      />
    </div>
  );
}
