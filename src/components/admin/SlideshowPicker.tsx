"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { Check, X, ArrowUp, ArrowDown, GripVertical, Save, Clapperboard } from "lucide-react";
import { updateSlideshow } from "@/actions/slideshowConfig";
import type { SlideshowActionState } from "@/actions/slideshowConfig";
import type { Photo } from "@/lib/r2/types";
import { R2Image } from "@/components/photography/R2Image";

interface Props {
  photos: Photo[];
  /** r2Keys currently saved as slideshow, in order. null = not configured (fallback). */
  savedKeys: string[] | null;
}

export function SlideshowPicker({ photos, savedKeys }: Props) {
  const photoMap = Object.fromEntries(photos.map((p) => [p.r2Key, p]));

  // Ordered list of r2Keys selected for the slideshow
  const [selected, setSelected] = useState<string[]>(() => {
    if (!savedKeys) return [];
    // Keep only keys that still exist in photos
    return savedKeys.filter((k) => k in photoMap);
  });

  const [state, formAction, isPending] = useActionState<SlideshowActionState, FormData>(
    updateSlideshow,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Sync success flash
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (state.success) {
      setSaved(true);
      const id = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(id);
    }
  }, [state.success]);

  const toggle = useCallback((r2Key: string) => {
    setSelected((prev) =>
      prev.includes(r2Key) ? prev.filter((k) => k !== r2Key) : [...prev, r2Key]
    );
  }, []);

  const remove = useCallback((r2Key: string) => {
    setSelected((prev) => prev.filter((k) => k !== r2Key));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setSelected((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  function handleSubmit() {
    if (!formRef.current) return;
    const hidden = formRef.current.querySelector<HTMLInputElement>('input[name="keys"]');
    if (hidden) hidden.value = JSON.stringify(selected);
    formRef.current.requestSubmit();
  }

  const selectedSet = new Set(selected);

  return (
    <div className="space-y-8">

      {/* ── Current slideshow order ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest">
            Slideshow order{" "}
            <span className="normal-case font-normal">({selected.length} photo{selected.length !== 1 ? "s" : ""})</span>
          </h2>

          <div className="flex items-center gap-2">
            {state.error && (
              <p className="text-xs text-red-400">{state.error}</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                          font-medium transition-colors disabled:opacity-50 ${
                            saved
                              ? "bg-green-500/15 text-green-400 border border-green-500/30"
                              : "bg-accent text-white hover:bg-accent/90"
                          }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isPending ? "Saving…" : saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>

        {selected.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Clapperboard className="w-8 h-8 text-ink-muted opacity-30 mx-auto mb-2" />
            <p className="text-sm text-ink-muted">
              No photos selected. Click photos below to add them to the slideshow.
            </p>
            <p className="text-xs text-ink-muted mt-1 opacity-70">
              If left empty, the home page will fall back to showing photos from your Favourites gallery.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {selected.map((r2Key, i) => {
              const photo = photoMap[r2Key];
              if (!photo) return null;
              return (
                <div
                  key={r2Key}
                  className="relative group rounded-lg overflow-hidden bg-surface-2"
                  style={{ width: 96, height: 96 }}
                >
                  <R2Image
                    photo={photo}
                    alt={photo.title}
                    className="object-cover"
                    sizes="96px"
                  />
                  {/* Order badge */}
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70
                                  text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  {/* Controls overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50
                                  transition-colors flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      title="Move left"
                      className="p-1 rounded text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r2Key)}
                      title="Remove"
                      className="p-1 rounded text-white hover:bg-red-500/50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(i)}
                      disabled={i === selected.length - 1}
                      title="Move right"
                      className="p-1 rounded text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Hidden form for server action submission */}
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="keys" defaultValue="[]" />
      </form>

      {/* ── Photo grid ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
          All photos — click to add / remove
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {photos.map((photo) => {
            const isSelected = selectedSet.has(photo.r2Key);
            const order = selected.indexOf(photo.r2Key);
            return (
              <button
                key={photo.r2Key}
                type="button"
                onClick={() => toggle(photo.r2Key)}
                title={photo.title}
                className={`relative aspect-square rounded-lg overflow-hidden bg-surface-2
                            focus:outline-none transition-all ${
                              isSelected
                                ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                                : "hover:ring-2 hover:ring-border ring-offset-1 ring-offset-surface"
                            }`}
              >
                <R2Image
                  photo={photo}
                  alt={photo.title}
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 12vw"
                  loading="lazy"
                />
                {isSelected && (
                  <>
                    <div className="absolute inset-0 bg-accent/20" />
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent
                                    text-white text-[10px] font-bold flex items-center justify-center">
                      {order + 1}
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
