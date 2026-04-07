"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "eu", label: "Euskara" },
  { code: "ca", label: "Català" },
] as const;

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectLocale(code: string) {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setOpen(false);
    router.refresh();
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150",
          "text-ink-secondary hover:text-ink-primary hover:bg-surface-3 border border-transparent",
          open && "bg-surface-3 border-border text-ink-primary"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-medium">{current.label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border
                     bg-surface-2 shadow-xl shadow-black/40 py-1 z-50 animate-fade-in"
        >
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              role="option"
              aria-selected={code === locale}
              onClick={() => selectLocale(code)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                code === locale
                  ? "text-accent"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-surface-3"
              )}
            >
              {label}
              {code === locale && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
