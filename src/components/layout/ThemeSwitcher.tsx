"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; Icon: React.ElementType; label: string }[] = [
  { value: "light",  Icon: Sun,     label: "Light"  },
  { value: "dark",   Icon: Moon,    label: "Dark"   },
  { value: "system", Icon: Monitor, label: "System" },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

export function ThemeSwitcher() {
  const [theme, setTheme]   = useState<Theme>("dark");
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);

  // Read stored theme once on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)THEME=([^;]*)/);
    const stored = match ? decodeURIComponent(match[1]) : "dark";
    if (["light", "dark", "system"].includes(stored)) {
      setTheme(stored as Theme);
    }
  }, []);

  // Track system preference changes when theme === "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Close on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function select(t: Theme) {
    setTheme(t);
    setOpen(false);
    document.cookie = `THEME=${t}; path=/; max-age=31536000; SameSite=Lax`;
    applyTheme(t);
  }

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1];

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
        aria-label="Change theme"
      >
        <current.Icon className="w-3.5 h-3.5" />
        <span className="font-medium hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-32 rounded-xl border border-border
                     bg-surface-2 shadow-xl shadow-black/20 py-1 z-50 animate-fade-in"
        >
          {OPTIONS.map(({ value, Icon, label }) => (
            <button
              key={value}
              role="option"
              aria-selected={value === theme}
              onClick={() => select(value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                value === theme
                  ? "text-accent"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-surface-3"
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
              {value === theme && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
