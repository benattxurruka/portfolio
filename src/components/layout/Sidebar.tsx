"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Github, Camera, ExternalLink, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

const LINKEDIN_URL = "https://www.linkedin.com/in/benattxurruka/";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  const navItems = [
    {
      href: "/github",
      label: t("github"),
      icon: Github,
      external: false,
      match: (p: string) => p.startsWith("/github"),
    },
    {
      href: "/photography",
      label: t("photography"),
      icon: Camera,
      external: false,
      match: (p: string) => p.startsWith("/photography"),
    },
    {
      href: LINKEDIN_URL,
      label: t("cv"),
      icon: FileText,
      external: true,
      match: () => false,
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-surface-1 border-r border-border hidden md:flex flex-col z-10"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Logo / Name — links to home */}
      <Link
        href="/"
        className="px-5 py-6 border-b border-border hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0">
            <Image
              src="/images/profile.jpg"
              alt="Profile"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-semibold text-ink-primary text-sm">
            {t("title")}
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold text-ink-muted uppercase tracking-widest">
          {t("navigation")}
        </p>
        {navItems.map(({ href, label, icon: Icon, external, match }) => {
          const active = match(pathname);
          const cls = cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            active
              ? "bg-accent/15 text-accent"
              : "text-ink-secondary hover:text-ink-primary hover:bg-surface-3"
          );

          if (external) {
            return (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-ink-muted" />
                {label}
                <ExternalLink className="w-3 h-3 ml-auto text-ink-muted opacity-60" />
              </a>
            );
          }

          return (
            <Link key={href} href={href} className={cls}>
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  active ? "text-accent" : "text-ink-muted"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-ink-muted">{t("footer")}</p>
      </div>
    </aside>
  );
}
