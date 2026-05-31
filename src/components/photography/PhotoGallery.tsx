"use client";

import type { Photo, VoteMap } from "@/lib/r2/types";
import { PhotoGrid } from "./PhotoGrid";
import { Lightbox } from "./Lightbox";
import { useLightbox } from "@/hooks/useLightbox";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";

interface Props {
  photos: Photo[];
  gallerySlug: string;
  votes: VoteMap;
}

export function PhotoGallery({ photos, gallerySlug, votes }: Props) {
  const { isOpen, currentIndex, currentPhoto, open, close, next, prev, isPlaying, togglePlay, openAndPlay } =
    useLightbox(photos);
  const t = useTranslations("Lightbox");

  if (photos.length === 0) {
    return (
      <p className="text-center text-ink-muted py-16">
        No photos in this gallery yet.
      </p>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => openAndPlay(0)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2 text-ink-secondary border border-border hover:bg-surface-3 hover:text-ink-primary transition-all text-sm font-medium"
        >
          <Play className="w-4 h-4" />
          {t("play")}
        </button>
      </div>
      <PhotoGrid photos={photos} onPhotoClick={open} />

      {isOpen && currentPhoto && currentIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={currentIndex}
          currentPhoto={currentPhoto}
          gallerySlug={gallerySlug}
          votes={votes}
          onClose={close}
          onNext={next}
          onPrev={prev}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
        />
      )}
    </>
  );
}
