import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const SUPPORTED_LOCALES = ["en", "es", "eu", "ca"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Parse the Accept-Language header and return the best matching supported locale.
 * Example input: "eu-ES,eu;q=0.9,es;q=0.8,en;q=0.7"
 */
function detectLocale(acceptLanguage: string): Locale {
  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      // Normalise "en-US" → "en", "eu-ES" → "eu"
      const lang = tag.trim().toLowerCase().split("-")[0];
      return { lang, q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    if ((SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
      return lang as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value;

  let locale: Locale;
  if (raw && (SUPPORTED_LOCALES as readonly string[]).includes(raw)) {
    // User has explicitly chosen a language — honour it.
    locale = raw as Locale;
  } else {
    // No preference stored yet — detect from the browser's Accept-Language header.
    const headerStore = await headers();
    locale = detectLocale(headerStore.get("Accept-Language") ?? "");
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
