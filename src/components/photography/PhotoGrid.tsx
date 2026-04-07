"use client";

import Image from "next/image";
import type { Photo } from "@/lib/r2/types";
import { getPhotoUrl } from "@/lib/r2/photos";
import { cn } from "@/lib/utils/cn";

interface Props {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(index)}
          className={cn(
            "relative overflow-hidden rounded-lg bg-surface-2 aspect-square",
            "hover:ring-2 hover:ring-accent/60 transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          )}
          aria-label={`View photo: ${photo.title}`}
        >
          <Image
            src={getPhotoUrl(photo.r2Key)}
            alt={photo.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
