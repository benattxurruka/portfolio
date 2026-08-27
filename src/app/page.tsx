import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import { getTranslations } from "next-intl/server";
import * as Sentry from "@sentry/nextjs";
import { getPhotos, getPhotoUrl } from "@/lib/r2/photos";
import { getGalleryPhotos } from "@/lib/utils/galleries";
import { getSlideshowConfig } from "@/lib/r2/slideshowConfig";
import { fetchGitHubRepos } from "@/lib/github/repos";
import { HomeSlideshow } from "@/components/home/HomeSlideshow";
import type { GitHubRepo } from "@/lib/r2/types";
import { headers } from "next/headers";
import { recordPageView } from "@/lib/otel/metrics";

async function getTopRepos(): Promise<GitHubRepo[]> {
  try {
    const repos = await fetchGitHubRepos();
    // Starred repos first, then by most recently updated
    const sorted = [...repos].sort((a, b) => {
      const aStarred = a.stargazers_count > 0 ? 1 : 0;
      const bStarred = b.stargazers_count > 0 ? 1 : 0;
      return bStarred - aStarred;
    });
    return sorted.slice(0, 3);
  } catch (err) {
    Sentry.captureException(err);
    return [];
  }
}

export default async function HomePage() {
  const country = (await headers()).get("x-vercel-ip-country") ?? undefined;
  try { recordPageView("home", country); } catch {}
  const t = await getTranslations("Home");

  const [photos, repos, slideshowKeys] = await Promise.all([
    getPhotos().catch(() => []),
    getTopRepos(),
    getSlideshowConfig(),
  ]);

  // Slideshow: use admin-configured order if set, otherwise fall back to favourites
  let slideshowPhotos: { url: string; title: string }[];
  if (slideshowKeys && slideshowKeys.length > 0) {
    const photoByKey = Object.fromEntries(photos.map((p) => [p.r2Key, p]));
    slideshowPhotos = slideshowKeys
      .map((key) => photoByKey[key])
      .filter(Boolean)
      .map((p) => ({ url: getPhotoUrl(p.r2Key, p.updatedAt), title: p.title }));
  } else {
    const favourites = getGalleryPhotos(photos, "favourites");
    slideshowPhotos = (favourites.length > 0 ? favourites : photos)
      .slice(0, 6)
      .map((p) => ({ url: getPhotoUrl(p.r2Key, p.updatedAt), title: p.title }));
  }

  return (
    // Fill the space below the top bar exactly
    <div
      className="h-[calc(100vh-48px)]"
      style={{
        background: "linear-gradient(to right, #141210 0%, #141210 calc(max(0px, (100% - 1600px) / 2) - 40px), #181614 calc(max(0px, (100% - 1600px) / 2)), #181614 calc(100% - max(0px, (100% - 1600px) / 2)), #141210 calc(100% - max(0px, (100% - 1600px) / 2) + 40px), #141210 100%)",
      }}
    >
    <div className="h-full flex flex-col relative overflow-hidden md:max-w-[1600px] md:mx-auto md:w-full">

      {/* ── Top half: Photography slideshow ──────────────────────────────── */}
      <div className="flex-1 md:[flex-grow:1.2] relative overflow-hidden bg-[#111] min-h-0">
        <HomeSlideshow
          slides={slideshowPhotos}
          labelText={t("photographyTitle")}
          linkText={t("viewGallery")}
        />
      </div>

      {/* ── Bottom half: GitHub projects ──────────────────────────────────── */}
      <div
        className="flex-1 md:[flex-grow:0.8] relative min-h-0 flex items-center justify-center"
        style={{ background: "#262421" }}
      >
        <div className="w-full max-w-[640px] px-10 pt-[148px] md:pt-[118px] pb-10">
          {/* Section header */}
          <div className="flex items-center gap-2.5 mb-4">
            <Github className="w-[18px] h-[18px] text-[#f5f5f5]" />
            <h2
              className="text-[18px] text-[#f5f5f5] m-0"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 600 }}
            >
              {t("githubTitle")}
            </h2>
          </div>

          {/* Top 3 repos */}
          {repos.length > 0 ? (
            <div className="flex gap-2.5">
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 px-4 py-3.5 rounded-lg no-underline
                             transition-colors hover:border-[#5a534c]"
                  style={{
                    background: "#1f1d1a",
                    border: "1px solid #3a3733",
                  }}
                >
                  <p
                    className="text-[13px] text-[#ddd] truncate m-0"
                    style={{ fontFamily: "monospace" }}
                  >
                    {repo.name}
                  </p>
                  {repo.description && (
                    <p className="text-[11px] text-[#888] mt-1 m-0 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="flex gap-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-12 rounded-lg animate-pulse"
                  style={{ background: "#2a2825" }}
                />
              ))}
            </div>
          )}

          <Link
            href="/github"
            className="inline-block mt-3.5 text-[13px] font-semibold no-underline
                       hover:underline"
            style={{ color: "#d4a574" }}
          >
            {t("viewAllProjects")}
          </Link>
        </div>
      </div>

      {/* ── Avatar + name, centered at the seam ──────────────────────────── */}
      <div
        className="absolute top-1/2 md:top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2
                   z-10 flex flex-col items-center text-center pointer-events-none"
      >
        {/* Profile photo */}
        <div
          className="w-32 h-32 rounded-full overflow-hidden shrink-0"
          style={{
            border: "4px solid #1f1d1c",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <Image
            src="/images/profile.jpg"
            alt="Beñat Txurruka"
            width={128}
            height={128}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Name */}
        <h1
          className="mt-4 mb-0 text-[40px] leading-[1.05] text-white"
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontWeight: 700,
            textShadow: "0 2px 20px rgba(0,0,0,0.6)",
          }}
        >
          Beñat Txurruka
        </h1>

        {/* Subtitle */}
        <p
          className="mt-2 mb-0 text-[14px]"
          style={{
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 10px rgba(0,0,0,0.6)",
          }}
        >
          {t("subtitle")}
        </p>
      </div>
    </div>
    </div>
  );
}
