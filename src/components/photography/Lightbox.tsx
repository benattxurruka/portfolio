"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Heart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { Photo, VoteMap } from "@/lib/r2/types";
import { getPhotoUrl } from "@/lib/r2/photos";
import { useVote } from "@/hooks/useVote";
import { usePhotoTimer } from "@/hooks/usePhotoTimer";
import { recordView } from "@/actions/view";
import { cn } from "@/lib/utils/cn";

interface Props {
  photos: Photo[];
  currentIndex: number;
  currentPhoto: Photo;
  gallerySlug: string;
  votes: VoteMap;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function VoteButton({
  photoId,
  gallerySlug,
  initialCount,
}: {
  photoId: string;
  gallerySlug: string;
  initialCount: number;
}) {
  const t = useTranslations("Lightbox");
  const { hasVoted, count, vote, isPending } = useVote(photoId, gallerySlug, initialCount);

  return (
    <button
      onClick={vote}
      disabled={hasVoted || isPending}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        hasVoted
          ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-default"
          : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white"
      )}
      aria-label={hasVoted ? t("voteAlready") : t("vote")}
    >
      <Heart className={cn("w-4 h-4", hasVoted && "fill-red-400")} />
      <span>{count}</span>
    </button>
  );
}

export function Lightbox({
  photos,
  currentIndex,
  currentPhoto,
  gallerySlug,
  votes,
  onClose,
  onNext,
  onPrev,
}: Props) {
  const t = useTranslations("Lightbox");
  const locale = useLocale();

  usePhotoTimer(currentPhoto.id);

  useEffect(() => {
    recordView(currentPhoto.id, gallerySlug).catch(() => {});
  }, [currentPhoto.id, gallerySlug]);

  const photoUrl = getPhotoUrl(currentPhoto.r2Key);
  const initialVoteCount = votes[currentPhoto.id] ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo: ${currentPhoto.title}`}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white/70
                   hover:bg-white/20 hover:text-white transition-all"
        aria-label={t("close")}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Previous */}
      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full
                   bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
        aria-label={t("prev")}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full
                   bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
        aria-label={t("next")}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main image */}
      <div className="relative w-full h-full flex items-center justify-center px-20 py-24">
        <div className="relative max-w-full max-h-full w-full h-full">
          <Image
            key={currentPhoto.id}
            src={photoUrl}
            alt={currentPhoto.title}
            fill
            className="object-contain animate-fade-in"
            sizes="90vw"
            priority
          />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-20 py-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-end justify-between gap-4 max-w-3xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-white font-semibold text-lg">{currentPhoto.title}</h2>
            {currentPhoto.description && (
              <p className="text-white/60 text-sm">{currentPhoto.description}</p>
            )}
            <div className="flex items-center gap-4 text-white/40 text-xs">
              {currentPhoto.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentPhoto.location}
                </span>
              )}
              {currentPhoto.takenAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(currentPhoto.takenAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <VoteButton
            photoId={currentPhoto.id}
            gallerySlug={gallerySlug}
            initialCount={initialVoteCount}
          />
        </div>
      </div>
    </div>
  );
}
