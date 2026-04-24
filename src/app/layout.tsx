import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { recordSessionLanguage } from "@/lib/otel/metrics";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { ThemeScript } from "@/components/layout/ThemeScript";

export const metadata: Metadata = {
  title: {
    default: "Portfolio",
    template: "%s | Portfolio",
  },
  description: "Beñat Txurruka's personal portfolio — projects and photography",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, messages, cookieStore] = await Promise.all([
    getLocale(),
    getMessages(),
    await cookies(),
  ]);

  // Derive the initial html class server-side to reduce flash on first load.
  // "system" (and no cookie) cannot be resolved server-side — leave the class
  // empty and let ThemeScript correct it client-side before first paint.
  recordSessionLanguage(locale);

  // Derive the initial html class server-side to reduce flash on first load.
  // "system" (and no cookie) cannot be resolved server-side — leave the class
  // empty and let ThemeScript correct it client-side before first paint.
  const themeCookie = cookieStore.get("THEME")?.value ?? "system";
  const initialClass = themeCookie === "dark" ? "dark" : themeCookie === "light" ? "" : "";

  return (
    <html lang={locale} className={initialClass}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen">
            {/* Desktop sidebar — hidden on mobile */}
            <Sidebar />

            <div className="flex-1 min-w-0 md:ml-[var(--sidebar-width)] flex flex-col">
              {/* Top bar */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5
                              border-b border-border/50 bg-surface/80 backdrop-blur-sm">
                {/* Hamburger — visible on mobile only; renders drawer via portal */}
                <MobileNav />

                {/* Right-hand controls — always visible */}
                <div className="flex items-center gap-1">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                </div>
              </div>

              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
