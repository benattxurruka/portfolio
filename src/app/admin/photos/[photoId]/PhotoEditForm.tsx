"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import type { Photo } from "@/lib/r2/types";
import type { UpdatePhotoState } from "@/actions/updatePhoto";
import { cn } from "@/lib/utils/cn";

interface Props {
  photo: Photo;
  action: (prev: UpdatePhotoState, formData: FormData) => Promise<UpdatePhotoState>;
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  textarea?: boolean;
}) {
  const base =
    "w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink-primary text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";
  return (
    <div>
      <label className="block text-sm text-ink-secondary mb-1" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={base + " resize-y"}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={base}
        />
      )}
      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

// ── Gallery cover picker ──────────────────────────────────────────────────────

function GalleriesField({ photo }: { photo: Photo }) {
  // Galleries the photo explicitly belongs to (via metadata, not auto-derived from folder)
  const metaGalleries = photo.galleries;
  const [coverFor, setCoverFor] = useState<Set<string>>(
    new Set(photo.coverFor ?? [])
  );

  function toggleCover(galleryId: string) {
    setCoverFor((prev) => {
      const next = new Set(prev);
      if (next.has(galleryId)) next.delete(galleryId);
      else next.add(galleryId);
      return next;
    });
  }

  const coverForValue = [...coverFor].join(", ");

  return (
    <div className="space-y-3">
      {/* Editable galleries membership */}
      <Field
        label="Galleries"
        name="galleries"
        defaultValue={metaGalleries.join(", ")}
        placeholder="favourites, trips/japan-2024, themes/cityscape"
        hint="Comma-separated gallery IDs this photo belongs to."
      />

      {/* Cover photo picker */}
      <div>
        <p className="block text-sm text-ink-secondary mb-1">Cover photo for</p>

        {metaGalleries.length === 0 ? (
          <p className="text-xs text-ink-muted">
            Add the photo to at least one gallery above to set it as a cover.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {metaGalleries.map((id) => {
              const slug = id.split("/").pop() ?? id;
              const isCover = coverFor.has(id) || coverFor.has(slug);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCover(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isCover
                      ? "bg-accent/20 border-accent text-accent"
                      : "bg-surface-2 border-border text-ink-muted hover:border-accent/50 hover:text-ink-secondary"
                  )}
                  title={isCover ? `Remove cover for ${id}` : `Set as cover for ${id}`}
                >
                  <Star className={cn("w-3 h-3", isCover && "fill-accent")} />
                  {slug}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-ink-muted mt-1">
          Starred galleries will use this photo as their preview image on the Photography page.
        </p>

        {/* Hidden field carries the serialised value */}
        <input type="hidden" name="coverFor" value={coverForValue} />
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function PhotoEditForm({ photo, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="r2Key" value={photo.r2Key} />

      <Field
        label="Title"
        name="title"
        defaultValue={photo.title !== photo.id ? photo.title : ""}
        placeholder="e.g. Sunset over the bay"
      />

      <Field
        label="Description"
        name="description"
        defaultValue={photo.description}
        placeholder="A short caption shown in the lightbox"
        textarea
      />

      <Field
        label="Tags"
        name="tags"
        defaultValue={photo.tags?.join(", ")}
        placeholder="landscape, golden-hour, long-exposure"
        hint="Comma-separated. Used as filters on the Photography page."
      />

      <Field
        label="Location (display text)"
        name="location"
        defaultValue={photo.location}
        placeholder="e.g. Tokyo, Japan"
        hint="Shown with a pin icon in the lightbox."
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Latitude"
          name="lat"
          type="number"
          defaultValue={photo.lat?.toString()}
          placeholder="43.2630"
          hint="Decimal degrees. Enables the map."
        />
        <Field
          label="Longitude"
          name="lng"
          type="number"
          defaultValue={photo.lng?.toString()}
          placeholder="-2.9350"
        />
      </div>

      <GalleriesField photo={photo} />

      {state.error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2">Saved successfully.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium
                   hover:bg-accent/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
