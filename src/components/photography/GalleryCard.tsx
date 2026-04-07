import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Gallery } from "@/lib/r2/types";
import { getPhotoUrl } from "@/lib/r2/photos";
import { cn } from "@/lib/utils/cn";

interface Props {
  gallery: Gallery;
  featured?: boolean;
}

export async function GalleryCard({ gallery, featured = false }: Props) {
  const t = await getTranslations("GalleryCard");
  const coverUrl = gallery.coverPhoto
    ? getPhotoUrl(gallery.coverPhoto.r2Key)
    : null;

  return (
    <Link
      href={`/photography/${gallery.slug}`}
      className={cn(
        "card group relative overflow-hidden",
        featured ? "aspect-[21/9]" : "aspect-[4/3]"
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={gallery.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={featured ? "100vw" : "(max-width: 768px) 100vw, 33vw"}
        />
      ) : (
        <div className="absolute inset-0 bg-surface-3 flex items-center justify-center">
          <Images className="w-10 h-10 text-ink-muted opacity-40" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="tag text-[10px] mb-2 inline-block border-white/20 text-white/70 bg-white/10">
              {t(gallery.type)}
            </span>
            <h3
              className={cn(
                "font-semibold text-white",
                featured ? "text-2xl" : "text-lg"
              )}
            >
              {gallery.name}
            </h3>
            {featured && gallery.description && (
              <p className="text-white/60 text-sm mt-1">{gallery.description}</p>
            )}
          </div>
          <span className="text-white/50 text-sm flex-shrink-0">
            {gallery.photoCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
