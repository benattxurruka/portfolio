import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPhotos } from "@/lib/r2/photos";
import { getVotes } from "@/lib/r2/votes";
import { deriveTags, getPhotosByTag } from "@/lib/utils/galleries";
import { PhotoGallery } from "@/components/photography/PhotoGallery";
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
  try { recordPageView(`tag/${decoded}`); } catch {}

  const [photos, votes, t] = await Promise.all([
    getPhotos(),
    getVotes(),
    getTranslations("Gallery"),
  ]);

  const allTags = deriveTags(photos);
  if (!allTags.includes(decoded)) notFound();

  const taggedPhotos = getPhotosByTag(photos, decoded);

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
          <h1 className="text-2xl font-semibold text-ink-primary">#{decoded}</h1>
        </div>
        <p className="text-ink-muted text-sm mt-1 ml-8">
          {t("photoCount", { count: taggedPhotos.length })}
        </p>
      </div>

      <PhotoGallery photos={taggedPhotos} gallerySlug={`tag/${decoded}`} votes={votes} />
    </div>
  );
}
