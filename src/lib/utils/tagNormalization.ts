/**
 * Tag normalisation utilities — config-driven.
 *
 * The TagConfig is loaded from R2 at runtime (src/lib/r2/tagConfig.ts) so that
 * translations and variant mappings can be managed from the admin UI without
 * requiring a code change or redeployment.
 *
 * All functions accept the config as a plain parameter so they stay pure and
 * request-scoped (no module-level mutable state).
 */

/** Mapping from canonical slug → variants + per-locale labels. */
export type TagConfig = Record<
  string,
  {
    /** All raw tag strings (any language) that map to this canonical slug. */
    variants: string[];
    /** Display label per locale code (e.g. "en", "es", "ca", "eu"). */
    translations: Partial<Record<string, string>>;
  }
>;

/**
 * Hardcoded seed config — used as a base that is merged with (and overridden by)
 * whatever is stored in R2. This ensures the app works before R2 config is set up.
 *
 * Once you manage a canonical via the admin UI, the R2 entry takes precedence.
 */
export const DEFAULT_TAG_CONFIG: TagConfig = {
  catalonia: {
    variants: ["catalonia", "catalunya", "cataluña", "katalunia"],
    translations: { en: "Catalonia", es: "Cataluña", ca: "Catalunya", eu: "Katalunia" },
  },
};

/** Merge R2 config on top of hardcoded defaults (R2 wins on conflicts). */
export function mergeTagConfig(r2Config: TagConfig): TagConfig {
  return { ...DEFAULT_TAG_CONFIG, ...r2Config };
}

function buildVariantLookup(config: TagConfig): Map<string, string> {
  const map = new Map<string, string>();
  for (const [canonical, entry] of Object.entries(config)) {
    for (const variant of entry.variants) {
      map.set(variant.toLowerCase(), canonical);
    }
  }
  return map;
}

/**
 * Normalise a raw tag string from R2 photo metadata to its canonical slug.
 * - Registered variants (any language) map to their canonical key.
 * - Unregistered tags are lowercased with spaces converted to hyphens.
 */
export function normalizeTag(rawTag: string, config: TagConfig = DEFAULT_TAG_CONFIG): string {
  const lookup = buildVariantLookup(config);
  return (
    lookup.get(rawTag.toLowerCase()) ??
    rawTag.toLowerCase().replace(/\s+/g, "-")
  );
}

/** Return all known raw variants for a canonical slug. */
export function getTagVariants(
  canonicalSlug: string,
  config: TagConfig = DEFAULT_TAG_CONFIG
): string[] {
  return config[canonicalSlug]?.variants ?? [canonicalSlug];
}

/**
 * Return the display label for a canonical slug in the given locale.
 * Falls back to prettified canonical slug if no translation is defined.
 */
export function getTagLabel(
  canonicalSlug: string,
  locale: string,
  config: TagConfig = DEFAULT_TAG_CONFIG
): string {
  const translation = config[canonicalSlug]?.translations[locale];
  if (translation) return translation;
  return canonicalSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
