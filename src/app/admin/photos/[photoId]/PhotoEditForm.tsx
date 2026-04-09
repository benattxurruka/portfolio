"use client";

import { useActionState } from "react";
import type { Photo } from "@/lib/r2/types";
import type { UpdatePhotoState } from "@/actions/updatePhoto";

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

      <Field
        label="Galleries"
        name="galleries"
        defaultValue={photo.galleries.join(", ")}
        placeholder="favourites, trips/japan-2024, themes/cityscape"
        hint="Comma-separated gallery keys."
      />

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
