"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Camera, FileText, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { MobileNav } from "./MobileNav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";

const LINKEDIN_URL = "https://www.linkedin.com/in/benattxurruka/";

export function TopBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const t = useTranslations("Sidebar");

  const navItems = [
    { href: "/github",      label: t("github"),      Icon: Github,   external: false },
    { href: "/photography", label: t("photography"), Icon: Camera,   external: false },
    { href: LINKEDIN_URL,   label: t("cv"),          Icon: FileText, external: true  },
  ];

  const inner = (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5",
        "border-b border-border/50 bg-surface/80 backdrop-blur-sm",
        isHome && "dark md:max-w-[1600px] md:mx-auto"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-1">
        <MobileNav />
        {isHome && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, Icon, external }) => {
              const cls = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-3 transition-colors";
              if (external) {
                return (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                    <ExternalLink className="w-3 h-3 text-ink-muted opacity-60" />
                  </a>
                );
              }
              return (
                <Link key={href} href={href} className={cls}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </div>
  );

  return (
    <div
      className="sticky top-0 z-10"
      style={isHome ? { background: "#141210" } : undefined}
    >
      {inner}
    </div>
  );
}
