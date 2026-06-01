"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShieldOff } from "lucide-react";

/**
 * Detects common screenshot keyboard shortcuts and briefly blacks out the
 * screen to degrade the captured image, then shows a notice with a link
 * to the contact page.
 *
 * Shortcuts covered:
 *   - PrintScreen / SysRq            (Windows / Linux)
 *   - Meta+Shift+3/4/5               (macOS — full screen, selection, tool)
 *   - Meta+Ctrl+Shift+3/4            (macOS — to clipboard variants)
 *   - Meta+Shift+6                   (macOS — Touch Bar screenshot)
 *
 * Note: OS-level captures happen before the browser can prevent them on
 * most platforms, so the blackout is a best-effort deterrent.  @media print
 * (in globals.css) is the more reliable protection against print/PDF export.
 */
export function ScreenshotBlocker() {
  const [visible, setVisible] = useState(false);
  // Controls the full-screen blackout overlay (shown on keydown to degrade capture)
  const [blackout, setBlackout] = useState(false);

  const trigger = useCallback(() => {
    // Flash a black screen synchronously so it is captured instead of the photo
    setBlackout(true);
    setTimeout(() => setBlackout(false), 500);
    setVisible(true);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Windows / Linux: PrintScreen key
      if (e.key === "PrintScreen" || e.key === "Print" || e.code === "PrintScreen") {
        e.preventDefault();
        trigger();
        return;
      }
      // macOS screenshot shortcuts — use e.code (physical key) instead of e.key
      // because Shift changes e.key ("3" → "#" on US layout, "·" on ES, etc.)
      //   Cmd+Shift+3/4/5  full screen / selection / toolbar
      //   Cmd+Shift+6      Touch Bar
      if (
        e.metaKey && e.shiftKey && !e.ctrlKey &&
        ["Digit3", "Digit4", "Digit5", "Digit6"].includes(e.code)
      ) {
        e.preventDefault();
        trigger();
        return;
      }
      // macOS "copy to clipboard" variants: Cmd+Ctrl+Shift+3/4
      if (
        e.metaKey && e.ctrlKey && e.shiftKey &&
        ["Digit3", "Digit4"].includes(e.code)
      ) {
        e.preventDefault();
        trigger();
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [trigger]);

  return (
    <>
      {/* Full-screen blackout — shown for ~500 ms on screenshot attempt */}
      {blackout && (
        <div className="fixed inset-0 z-[300] bg-black" aria-hidden="true" />
      )}

      {/* Notice modal */}
      {visible && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setVisible(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 max-w-sm mx-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-surface-2 border border-border">
                <ShieldOff className="w-6 h-6 text-ink-secondary" />
              </div>
            </div>

            <h2 className="text-ink-primary font-semibold text-base mb-2">
              Capturas no permitidas
            </h2>
            <p className="text-ink-secondary text-sm mb-5 leading-relaxed">
              Las fotos están protegidas por derechos de autor.
              Si te interesa obtener una copia, puedes ponerte en contacto.
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="/contact"
                onClick={() => setVisible(false)}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium
                           hover:bg-accent/90 transition-colors"
              >
                Ir a contacto
              </Link>
              <button
                onClick={() => setVisible(false)}
                className="px-4 py-2 rounded-lg text-ink-muted text-sm
                           hover:text-ink-primary transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
