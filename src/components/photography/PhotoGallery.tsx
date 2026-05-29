"use client";

import { useState, useCallback } from "react";
import type { Photo, VoteMap } from "@/lib/r2/types";
import { PhotoGrid } from "./PhotoGrid";
import { Lightbox } from "./Lightbox";
import { useLightbox } from "@/hooks/useLightbox";

interface Props {
  photos: Photo[];
  gallerySlug: string;
  votes: VoteMap;
}

export function PhotoGallery({ photos, gallerySlug, votes }: Props) {
  const { isOpen, currentIndex, currentPhoto, open, close, next, prev, isPlaying, togglePlay } =
    useLightbox(photos);

  if (photos.length === 0) {
    return (
      <p className="text-center text-ink-muted py-16">
        No photos in this gallery yet.
      </p>
    );
  }

  return (
    <>
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
