"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className={cn("flex-1 min-w-0 flex flex-col", !isHome && "md:ml-[var(--sidebar-width)]")}>
      {children}
    </div>
  );
}
