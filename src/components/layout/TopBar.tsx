"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { MobileNav } from "./MobileNav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function TopBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between px-4 py-2.5",
        "border-b border-border/50 bg-surface/80 backdrop-blur-sm",
        isHome && "dark"
      )}
    >
      <MobileNav />
      <div className="flex items-center gap-1">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
