"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Github, Camera, FileText, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

const LINKEDIN_URL = "https://www.linkedin.com/in/benattxurruka/";

export function MobileNav() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const pathname                = usePathname();
  const t                       = useTranslations("Sidebar");

  // Portal target must exist (client-only)
  useEffect(() => { setMounted(true); }, []);

  // Close on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const navItems = [
    {
      href:     "/github",
      label:    t("github"),
      Icon:     Github,
      external: false,
      match:    (p: string) => p.startsWith("/github"),
    },
    {
      href:     "/photography",
      label:    t("photography"),
      Icon:     Camera,
      external: false,
      match:    (p: string) => p.startsWith("/photography"),
    },
    {
      href:     LINKEDIN_URL,
      label:    t("cv"),
      Icon:     FileText,
      external: true,
      match:    () => false,
    },
  ];

  const drawer = (
    <>
      {/* Backdrop — rendered via portal so it sits above everything */}
      <div
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel — solid bg-surface-1 guaranteed because it escapes
          any parent backdrop-filter via the portal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col md:hidden",
          "w-[var(--sidebar-width)]",
          "bg-surface-1 border-r border-border",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0">
              <Image
                src="/images/profile.jpg"
                alt="Profile"
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="font-semibold text-ink-primary text-sm">{t("title")}</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-surface-3 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-3 text-[10px] font-semibold text-ink-muted uppercase tracking-widest">
            {t("navigation")}
          </p>

          {navItems.map(({ href, label, Icon, external, match }) => {
            const active = match(pathname);
            const cls = cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              active
                ? "bg-accent/15 text-accent"
                : "text-ink-secondary hover:text-ink-primary hover:bg-surface-3"
            );

            if (external) {
              return (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  <Icon className="w-4 h-4 flex-shrink-0 text-ink-muted" />
                  {label}
                  <ExternalLink className="w-3 h-3 ml-auto text-ink-muted opacity-60" />
                </a>
              );
            }

            return (
              <Link key={href} href={href} className={cls}>
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-accent" : "text-ink-muted")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <p className="text-[11px] text-ink-muted">{t("footer")}</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger button — lives in the header bar, visible on mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-3 transition-colors"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Drawer + backdrop rendered into document.body to escape any
          parent backdrop-filter / stacking-context issues */}
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
