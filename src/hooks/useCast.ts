"use client";

/**
 * Google Cast (Chromecast) integration.
 *
 * Loads the Cast Web Sender SDK lazily and exposes a minimal API for
 * sending photos to any Cast-capable device (Chromecast, Android TV, etc.).
 *
 * The hook is safe to use in non-Chrome environments: `isAvailable` stays
 * false when the Cast extension / API is not present, so callers can
 * hide the Cast button entirely.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const CAST_SDK = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

// Module-level flag so the Cast context is initialised only once even if the
// Lightbox component mounts/unmounts multiple times.
let _castReady = false;
const _readyCallbacks: Array<() => void> = [];

function markCastReady() {
  _castReady = true;
  _readyCallbacks.splice(0).forEach((cb) => cb());
}

// Typed shims for the Cast globals — avoids @types/cast-sender peer dep.
interface CastContext {
  setOptions(opts: object): void;
  requestSession(): Promise<void>;
  endCurrentSession(stopCasting: boolean): void;
  getCurrentSession(): CastSession | null;
  addEventListener(type: string, handler: (e: { sessionState: string }) => void): void;
  removeEventListener(type: string, handler: (e: { sessionState: string }) => void): void;
}
interface CastSession {
  loadMedia(req: unknown): Promise<void>;
}

function getCastGlobals() {
  const w = window as unknown as {
    cast?: {
      framework: {
        CastContext: { getInstance(): CastContext };
        CastContextEventType: { SESSION_STATE_CHANGED: string };
        SessionState: { SESSION_STARTED: string; SESSION_RESUMED: string };
      };
    };
    chrome?: {
      cast?: {
        AutoJoinPolicy: { ORIGIN_SCOPED: string };
        media: {
          DEFAULT_MEDIA_RECEIVER_APP_ID: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          MediaInfo: new (url: string, contentType: string) => any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          LoadRequest: new (info: unknown) => any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          PhotoMediaMetadata: new () => any;
          MetadataType: { PHOTO: number };
        };
      };
    };
  };
  return { cast: w.cast, cc: w.chrome?.cast };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface CastControls {
  /** True when a Cast device is reachable and the API is initialised. */
  isAvailable: boolean;
  /** True while an active Cast session exists. */
  isCasting: boolean;
  /** Open the native device picker and start a session. */
  startCast(): void;
  /** End the current Cast session. */
  stopCast(): void;
  /**
   * Send a photo to the receiver.
   * Call this whenever the current photo changes during an active session.
   */
  castMedia(url: string, title?: string): void;
}

export function useCast(): CastControls {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCasting, setIsCasting]     = useState(false);
  const ctxRef = useRef<CastContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function init() {
      const { cast, cc } = getCastGlobals();
      if (!cast || !cc) return;

      const ctx = cast.framework.CastContext.getInstance();
      ctx.setOptions({
        receiverApplicationId: cc.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy:        cc.AutoJoinPolicy.ORIGIN_SCOPED,
      });
      ctxRef.current = ctx;
      setIsAvailable(true);

      const { SESSION_STATE_CHANGED } = cast.framework.CastContextEventType;
      const { SESSION_STARTED, SESSION_RESUMED } = cast.framework.SessionState;

      function onSessionChange(e: { sessionState: string }) {
        setIsCasting(
          e.sessionState === SESSION_STARTED ||
          e.sessionState === SESSION_RESUMED
        );
      }

      ctx.addEventListener(SESSION_STATE_CHANGED, onSessionChange);
      return () => ctx.removeEventListener(SESSION_STATE_CHANGED, onSessionChange);
    }

    // Already initialised from a previous mount — connect immediately.
    if (_castReady) {
      const cleanup = init();
      return cleanup;
    }

    // First mount — set the global callback before injecting the script tag.
    (window as unknown as { __onGCastApiAvailable?: (ok: boolean) => void })
      .__onGCastApiAvailable = (ok: boolean) => {
        if (!ok) return;
        markCastReady();
        init();
      };

    if (!document.querySelector(`script[src="${CAST_SDK}"]`)) {
      const s = document.createElement("script");
      s.src = CAST_SDK;
      document.head.appendChild(s);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startCast = useCallback(() => {
    ctxRef.current?.requestSession().catch(() => {});
  }, []);

  const stopCast = useCallback(() => {
    ctxRef.current?.endCurrentSession(true);
  }, []);

  const castMedia = useCallback((url: string, title = "") => {
    const session = ctxRef.current?.getCurrentSession();
    if (!session) return;

    const { cc } = getCastGlobals();
    if (!cc) return;

    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"  ? "image/png"  :
      ext === "webp" ? "image/webp" :
      ext === "gif"  ? "image/gif"  :
      "image/jpeg";

    const info = new cc.media.MediaInfo(url, contentType);
    info.metadata = new cc.media.PhotoMediaMetadata();
    info.metadata.metadataType = cc.media.MetadataType.PHOTO;
    info.metadata.title = title;

    session.loadMedia(new cc.media.LoadRequest(info)).catch(() => {});
  }, []);

  return { isAvailable, isCasting, startCast, stopCast, castMedia };
}
