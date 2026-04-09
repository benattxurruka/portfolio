"use client";

import { useEffect, useState } from "react";
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
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Reset loading state whenever the photo changes
  useEffect(() => {
    setIsImageLoading(true);
  }, [currentPhoto.id]);

  usePhotoTimer(currentPhoto.id);

  useEffect(() => {
    recordView(currentPhoto.id, gallerySlug).catch(() => {});
  }, [currentPhoto.id, gallerySlug]);

  const photoUrl = getPhotoUrl(currentPhoto.r2Key);
  const initialVoteCount = votes[currentPhoto.id] ?? 0;

  const navButtonBase =
    "p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 animate-fade-in flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo: ${currentPhoto.title}`}
    >
      {/* ── Top bar: counter + close ──────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-white/50 text-sm">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
          aria-label={t("close")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Image area ────────────────────────────────────────────────────── */}
      {/*
        Portrait: image fills full width, no horizontal padding for side buttons.
        Landscape / desktop: pad sides so the absolute nav buttons don't overlap.
      */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center landscape:px-16">
        {/* Side nav — landscape & desktop only */}
        <button
          onClick={onPrev}
          className={cn(navButtonBase, "hidden landscape:flex absolute left-4 top-1/2 -translate-y-1/2 z-10")}
          aria-label={t("prev")}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          className="relative w-full h-full"
          onContextMenu={(e) => e.preventDefault()}
        >
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <svg
                className="w-10 h-10 animate-spin text-white/50"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}
          <Image
            key={currentPhoto.id}
            src={photoUrl}
            alt={currentPhoto.title}
            fill
            draggable={false}
            className={cn("object-contain animate-fade-in select-none", isImageLoading && "opacity-0")}
            sizes="(orientation: portrait) 100vw, 90vw"
            priority
            onLoad={() => setIsImageLoading(false)}
          />
        </div>

        <button
          onClick={onNext}
          className={cn(navButtonBase, "hidden landscape:flex absolute right-4 top-1/2 -translate-y-1/2 z-10")}
          aria-label={t("next")}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* ── Portrait bottom bar: prev / info / next ────────────────────────
          Shown only in portrait. Replaces the side buttons.               */}
      <div className="landscape:hidden shrink-0 flex flex-col gap-3 px-4 py-4">
        {/* Nav row */}
        <div className="flex items-center justify-between">
          <button onClick={onPrev} className={navButtonBase} aria-label={t("prev")}>
            <ChevronLeft className="w-6 h-6" />
          </button>

          <VoteButton
            photoId={currentPhoto.id}
            gallerySlug={gallerySlug}
            initialCount={initialVoteCount}
          />

          <button onClick={onNext} className={navButtonBase} aria-label={t("next")}>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Photo info */}
        <div className="space-y-1">
          <h2 className="text-white font-semibold">{currentPhoto.title}</h2>
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
      </div>

      {/* ── Landscape / desktop bottom overlay: info + vote ───────────────── */}
      <div className="hidden landscape:block absolute bottom-0 left-0 right-0 px-20 py-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="flex items-end justify-between gap-4 max-w-3xl mx-auto pointer-events-auto">
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
