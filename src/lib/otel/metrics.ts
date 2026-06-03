import { metrics } from "@opentelemetry/api";

const METER_NAME = "portfolio";

/**
 * Lazy-initialised metric instruments.
 * All instruments are created on first access to avoid issues during
 * server-side module loading before the OTel SDK is registered.
 */
function getMeter() {
  return metrics.getMeter(METER_NAME, "1.0.0");
}

let _photoViewCounter: ReturnType<
  ReturnType<typeof getMeter>["createCounter"]
> | null = null;
let _photoVoteCounter: ReturnType<
  ReturnType<typeof getMeter>["createCounter"]
> | null = null;
let _photoViewDuration: ReturnType<
  ReturnType<typeof getMeter>["createHistogram"]
> | null = null;
let _pageViewCounter: ReturnType<
  ReturnType<typeof getMeter>["createCounter"]
> | null = null;

/** Increment when a photo slideshow view is opened */
export function recordPhotoView(
  photoId: string,
  gallerySlug: string,
  country?: string
): void {
  if (!_photoViewCounter) {
    _photoViewCounter = getMeter().createCounter("portfolio.photo.views", {
      description: "Number of times a photo was opened in the slideshow",
    });
  }
  _photoViewCounter.add(1, {
    photo_id: photoId,
    gallery: gallerySlug,
    ...(country ? { country } : {}),
  });
}

/** Increment when a user casts a vote on a photo */
export function recordPhotoVote(
  photoId: string,
  gallerySlug: string,
  country?: string
): void {
  if (!_photoVoteCounter) {
    _photoVoteCounter = getMeter().createCounter("portfolio.photo.votes", {
      description: "Number of votes cast on a photo",
    });
  }
  _photoVoteCounter.add(1, {
    photo_id: photoId,
    gallery: gallerySlug,
    ...(country ? { country } : {}),
  });
}

/**
 * Record how long (in seconds) a user spent viewing a photo.
 * Should be called when the slideshow is closed or the photo changes.
 */
export function recordPhotoViewDuration(
  photoId: string,
  durationSeconds: number
): void {
  if (!_photoViewDuration) {
    _photoViewDuration = getMeter().createHistogram(
      "portfolio.photo.view_duration_seconds",
      {
        description: "Time spent viewing a photo in the slideshow (seconds)",
        unit: "s",
      }
    );
  }
  _photoViewDuration.record(durationSeconds, { photo_id: photoId });
}

/** Increment on any page load */
export function recordPageView(page: string, country?: string): void {
  if (!_pageViewCounter) {
    _pageViewCounter = getMeter().createCounter("portfolio.page.views", {
      description: "Number of page views",
    });
  }
  _pageViewCounter.add(1, { page, ...(country ? { country } : {}) });
}

let _sessionLanguageCounter: ReturnType<
  ReturnType<typeof getMeter>["createCounter"]
> | null = null;

/** Increment on each request to track which locale is active */
export function recordSessionLanguage(locale: string, country?: string): void {
  if (!_sessionLanguageCounter) {
    _sessionLanguageCounter = getMeter().createCounter(
      "portfolio.session.language",
      {
        description: "Number of requests per locale",
      }
    );
  }
  _sessionLanguageCounter.add(1, { locale, ...(country ? { country } : {}) });
}
