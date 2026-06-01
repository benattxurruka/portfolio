"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  X, ChevronLeft, ChevronRight, Info,
  MapPin, Calendar, Heart, Tag, Play, Pause, Cast, Share2,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { Photo, VoteMap } from "@/lib/r2/types";
import { getPhotoUrl } from "@/lib/r2/photos";
import { useVote } from "@/hooks/useVote";
import { usePhotoTimer } from "@/hooks/usePhotoTimer";
import { useCast } from "@/hooks/useCast";
import { SLIDESHOW_DELAY } from "@/hooks/useLightbox";
import { ScreenshotBlocker } from "./ScreenshotBlocker";
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
  isPlaying: boolean;
  onTogglePlay: () => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoMap({ lat, lng }: { lat: number; lng: number }) {
  const delta = 0.005;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div className="rounded-lg overflow-hidden border border-white/10" style={{ height: 140 }}>
      <iframe
        title="Photo location"
        src={src}
        width="100%"
        height="140"
        loading="lazy"
        className="block"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

function VoteButton({
  photoId,
  gallerySlug,
  initialCount,
  compact = false,
}: {
  photoId: string;
  gallerySlug: string;
  initialCount: number;
  compact?: boolean;
}) {
  const t = useTranslations("Lightbox");
  const { hasVoted, count, vote, isPending } = useVote(photoId, gallerySlug, initialCount);

  return (
    <button
      onClick={vote}
      disabled={isPending}
      className={cn(
        "flex items-center transition-all duration-200 shrink-0",
        compact
          ? "gap-1 px-2.5 py-1.5 rounded-full text-sm"
          : "gap-2 px-4 py-2 rounded-full text-sm font-medium",
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

// ── Main component ────────────────────────────────────────────────────────────

export function Lightbox({
  photos,
  currentIndex,
  currentPhoto,
  gallerySlug,
  votes,
  onClose,
  onNext,
  onPrev,
  isPlaying,
  onTogglePlay,
}: Props) {
  const t = useTranslations("Lightbox");
  const locale = useLocale();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset loading state whenever the photo changes
  useEffect(() => {
    setIsImageLoading(true);
  }, [currentPhoto.id]);

  // Detect Web Share API support after mount (not available in all browsers/SSR)
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function handleShare() {
    try {
      await navigator.share({ title: currentPhoto.title, url: photoUrl });
    } catch {
      // User cancelled or share not supported — nothing to do
    }
  }

  // ArrowUp → show info panel, ArrowDown → hide it
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp") { e.preventDefault(); setShowInfo(true); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setShowInfo(false); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  usePhotoTimer(currentPhoto.id);

  useEffect(() => {
    recordView(currentPhoto.id, gallerySlug).catch(() => {});
  }, [currentPhoto.id, gallerySlug]);

  const { isAvailable: castAvailable, isCasting, startCast, stopCast, castMedia } = useCast();

  const photoUrl = getPhotoUrl(currentPhoto.r2Key);
  const initialVoteCount = votes[currentPhoto.id] ?? 0;

  // Keep the Cast receiver in sync as the user browses photos
  useEffect(() => {
    if (isCasting) castMedia(photoUrl, currentPhoto.title);
  }, [currentPhoto.id, isCasting]); // eslint-disable-line react-hooks/exhaustive-deps

  const navBtn =
    "p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all";

  // Whether there is any info worth showing
  const hasInfo =
    currentPhoto.description ||
    currentPhoto.location ||
    currentPhoto.takenAt ||
    (currentPhoto.tags?.length ?? 0) > 0 ||
    currentPhoto.lat != null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 animate-fade-in flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo: ${currentPhoto.title}`}
    >
      <ScreenshotBlocker />
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 relative">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {photos.length}
          </span>

          <div className="flex items-center gap-2">
            {/* Cast button — only shown when a Cast device is reachable */}
            {castAvailable && (
              <button
                onClick={isCasting ? stopCast : startCast}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isCasting
                    ? "bg-blue-500/30 text-blue-300"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
                aria-label={isCasting ? t("stopCast") : t("cast")}
                aria-pressed={isCasting}
              >
                <Cast className="w-5 h-5" />
              </button>
            )}

            {/* Play / pause slideshow */}
            <button
              onClick={onTogglePlay}
              className={cn(
                "p-2 rounded-full transition-all",
                isPlaying
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
              aria-label={isPlaying ? t("pause") : t("play")}
              aria-pressed={isPlaying}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Vote button */}
            <VoteButton
              photoId={currentPhoto.id}
              gallerySlug={gallerySlug}
              initialCount={initialVoteCount}
              compact
            />

            {/* Info toggle */}
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={cn(
                "p-2 rounded-full transition-all relative",
                showInfo
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
              aria-label={showInfo ? t("hideInfo") : t("showInfo")}
              aria-expanded={showInfo}
            >
              <Info className="w-5 h-5" />
              {!showInfo && hasInfo && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>

            {/* Share — only shown when Web Share API is available (mobile / modern desktop) */}
            {canShare && (
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                aria-label={t("share")}
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
              aria-label={t("close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slideshow progress bar — resets on each photo via key */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
            <div
              key={currentPhoto.id}
              className="h-full bg-white/50 origin-left w-full"
              style={{ animation: `slideshow-progress ${SLIDESHOW_DELAY}ms linear forwards` }}
            />
          </div>
        )}
      </div>

      {/* ── Image area ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 relative flex items-center justify-center landscape:px-16"
        onTouchStart={(e) => {
          if (e.touches.length > 1) {
            // Multi-touch (pinch/zoom) — disable swipe detection
            touchStartX.current = null;
            return;
          }
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          // If a second finger is added mid-gesture, cancel the pending swipe
          if (e.touches.length > 1) touchStartX.current = null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) < 50) return; // ignore taps / micro-swipes
          if (delta < 0) onNext(); else onPrev();
        }}
      >
        {/* Side nav — landscape & desktop only */}
        <button
          onClick={onPrev}
          className={cn(navBtn, "hidden landscape:flex absolute left-4 top-1/2 -translate-y-1/2 z-10")}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
          className={cn(navBtn, "hidden landscape:flex absolute right-4 top-1/2 -translate-y-1/2 z-10")}
          aria-label={t("next")}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* ── Portrait nav bar ──────────────────────────────────────────────── */}
      <div className="landscape:hidden shrink-0 flex items-center justify-between px-4 py-3">
        <button onClick={onPrev} className={navBtn} aria-label={t("prev")}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={onNext} className={navBtn} aria-label={t("next")}>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* ── Collapsible info panel ────────────────────────────────────────── */}
      {showInfo && (
        <div className="shrink-0 border-t border-white/10 px-4 pt-4 pb-5 space-y-4 overflow-y-auto max-h-[50vh] animate-fade-in">
          {/* Title + description */}
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-base leading-snug">
              {currentPhoto.title}
            </h2>
            {currentPhoto.description && (
              <p className="text-white/60 text-sm mt-1">{currentPhoto.description}</p>
            )}
          </div>

          {/* Tags */}
          {(currentPhoto.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {currentPhoto.tags!.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                             bg-white/10 text-white/70 border border-white/10"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Location + date */}
          {(currentPhoto.location || currentPhoto.takenAt) && (
            <div className="flex flex-wrap items-center gap-4 text-white/40 text-xs">
              {currentPhoto.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {currentPhoto.location}
                </span>
              )}
              {currentPhoto.takenAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {new Date(currentPhoto.takenAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          )}

          {/* Map */}
          {currentPhoto.lat != null && currentPhoto.lng != null && (
            <PhotoMap lat={currentPhoto.lat} lng={currentPhoto.lng} />
          )}
        </div>
      )}
    </div>
  );
}
