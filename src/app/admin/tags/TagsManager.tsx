"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { TagConfig } from "@/lib/utils/tagNormalization";
import { upsertTag, deleteTag } from "@/actions/updateTagConfig";
import type { TagActionState } from "@/actions/updateTagConfig";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ca", label: "Català" },
  { code: "eu", label: "Euskara" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-border text-ink-primary text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";

// ── Tag form (shared by add and edit) ────────────────────────────────────────

interface TagFormProps {
  initial?: {
    canonical: string;
    variants: string[];
    translations: Record<string, string>;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function TagForm({ initial, onSuccess, onCancel }: TagFormProps) {
  const [state, formAction, isPending] = useActionState<TagActionState, FormData>(
    upsertTag,
    {}
  );
  const calledSuccess = useRef(false);

  useEffect(() => {
    if (state.success && !calledSuccess.current) {
      calledSuccess.current = true;
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 p-4 bg-surface-2 rounded-xl border border-border">
      {state.error && (
        <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      {/* Canonical slug */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Canonical slug
        </label>
        <input
          name="canonical"
          defaultValue={initial?.canonical}
          readOnly={!!initial}
          placeholder="e.g. basque-country"
          className={`${inputClass} ${initial ? "opacity-60 cursor-not-allowed" : ""}`}
        />
        <p className="text-xs text-ink-muted mt-1">
          Lowercase, hyphenated. Used in URLs and as translation key.
        </p>
      </div>

      {/* Variants */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Variants{" "}
          <span className="font-normal text-ink-muted/70">(comma-separated)</span>
        </label>
        <input
          name="variants"
          defaultValue={initial?.variants.join(", ")}
          placeholder="basque country, país vasco, euskadi, euskal herria"
          className={inputClass}
        />
        <p className="text-xs text-ink-muted mt-1">
          All raw tag values (any language) that should map to this canonical.
        </p>
      </div>

      {/* Translations */}
      <div>
        <p className="text-xs font-medium text-ink-muted mb-2">Translations</p>
        <div className="grid grid-cols-2 gap-3">
          {LOCALES.map(({ code, label }) => (
            <div key={code}>
              <label className="block text-xs text-ink-muted mb-1">{label}</label>
              <input
                name={`translation_${code}`}
                defaultValue={initial?.translations[code] ?? ""}
                placeholder={`Label in ${label}`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white
                     text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface
                     border border-border text-ink-secondary text-sm
                     hover:text-ink-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Delete button ─────────────────────────────────────────────────────────────

function DeleteButton({
  canonical,
  onSuccess,
}: {
  canonical: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<TagActionState, FormData>(
    deleteTag,
    {}
  );
  const calledSuccess = useRef(false);

  useEffect(() => {
    if (state.success && !calledSuccess.current) {
      calledSuccess.current = true;
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction}>
      <input type="hidden" name="canonical" value={canonical} />
      <button
        type="submit"
        disabled={isPending}
        title="Delete tag"
        className="p-1.5 rounded-md text-ink-muted hover:text-red-400 hover:bg-red-400/10
                   disabled:opacity-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}

// ── Tag row ───────────────────────────────────────────────────────────────────

function TagRow({
  canonical,
  entry,
  isEditing,
  onEditStart,
  onSuccess,
}: {
  canonical: string;
  entry: TagConfig[string];
  isEditing: boolean;
  onEditStart: () => void;
  onSuccess: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isEditing) {
    return (
      <div className="rounded-xl border border-accent/40 overflow-hidden">
        <TagForm
          initial={{
            canonical,
            variants: entry.variants,
            translations: entry.translations as Record<string, string>,
          }}
          onSuccess={onSuccess}
          onCancel={onSuccess}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Tag className="w-4 h-4 text-accent shrink-0" />
        <code className="text-sm font-mono text-ink-primary flex-1">{canonical}</code>

        {/* Locale pills */}
        <div className="hidden sm:flex items-center gap-1.5 flex-1">
          {LOCALES.map(({ code }) => (
            <span
              key={code}
              title={entry.translations[code] ?? "—"}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                entry.translations[code]
                  ? "bg-accent/10 text-accent"
                  : "bg-surface-3 text-ink-muted"
              }`}
            >
              {code}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand variants"}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary
                       hover:bg-surface-3 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onEditStart}
            title="Edit"
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary
                       hover:bg-surface-3 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <DeleteButton canonical={canonical} onSuccess={onSuccess} />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-ink-muted mb-1.5">Variants</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.variants.map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded-full bg-surface border border-border
                             text-xs text-ink-secondary"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted mb-1.5">Translations</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOCALES.map(({ code, label }) => (
                <div key={code}>
                  <span className="block text-xs text-ink-muted">{label}</span>
                  <span className="text-sm text-ink-primary">
                    {entry.translations[code] ?? (
                      <span className="italic text-ink-muted">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** Merged tag config (defaults + R2). */
  tagConfig: TagConfig;
  /** Canonical tags derived from photos that have no config entry yet. */
  untranslatedTags: string[];
}

export function TagsManager({ tagConfig, untranslatedTags }: Props) {
  const router = useRouter();
  const [editingCanonical, setEditingCanonical] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSuccess = useCallback(() => {
    setEditingCanonical(null);
    setShowAddForm(false);
    router.refresh();
  }, [router]);

  const configEntries = Object.entries(tagConfig);

  return (
    <div className="space-y-6">
      {/* Add new tag */}
      {showAddForm ? (
        <TagForm
          onSuccess={handleSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed
                     border-border text-ink-muted text-sm hover:border-accent hover:text-accent
                     transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add tag translation
        </button>
      )}

      {/* Existing entries */}
      {configEntries.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
            Configured tags ({configEntries.length})
          </h2>
          <div className="space-y-2">
            {configEntries.map(([canonical, entry]) => (
              <TagRow
                key={canonical}
                canonical={canonical}
                entry={entry}
                isEditing={editingCanonical === canonical}
                onEditStart={() => setEditingCanonical(canonical)}
                onSuccess={handleSuccess}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tags detected in photos with no translation yet */}
      {untranslatedTags.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-1">
            Detected in photos — no translation yet ({untranslatedTags.length})
          </h2>
          <p className="text-xs text-ink-muted mb-3">
            These tags appear in your photos but have no translation configured.
            They will show as prettified slugs. Click one to add translations.
          </p>
          <div className="flex flex-wrap gap-2">
            {untranslatedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setShowAddForm(true);
                  setEditingCanonical(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                           bg-surface-2 border border-dashed border-border text-ink-muted
                           hover:border-accent hover:text-accent transition-colors"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {configEntries.length === 0 && untranslatedTags.length === 0 && (
        <p className="text-sm text-ink-muted py-8 text-center">
          No tags found. Upload photos with tags to get started.
        </p>
      )}
    </div>
  );
}
