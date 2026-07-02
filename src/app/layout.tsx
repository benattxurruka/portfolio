import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Playfair_Display, Crimson_Text } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-crimson",
  display: "swap",
});
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
  const [locale, messages, cookieStore, reqHeaders] = await Promise.all([
    getLocale(),
    getMessages(),
    await cookies(),
    await headers(),
  ]);

  const country = reqHeaders.get("x-vercel-ip-country") ?? undefined;

  // Derive the initial html class server-side to reduce flash on first load.
  // "system" (and no cookie) cannot be resolved server-side — leave the class
  // empty and let ThemeScript correct it client-side before first paint.
  recordSessionLanguage(locale, country);

  // Derive the initial html class server-side to reduce flash on first load.
  // "system" (and no cookie) cannot be resolved server-side — leave the class
  // empty and let ThemeScript correct it client-side before first paint.
  const themeCookie = cookieStore.get("THEME")?.value ?? "system";
  const initialClass = themeCookie === "dark" ? "dark" : themeCookie === "light" ? "" : "";

  const fontVars = `${playfair.variable} ${crimson.variable}`;

  return (
    <html lang={locale} className={[initialClass, fontVars].filter(Boolean).join(" ")} suppressHydrationWarning>
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
