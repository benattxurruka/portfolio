import type { Metadata } from "next";
import { Github, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RepoGrid } from "@/components/github/RepoGrid";
import { recordPageView } from "@/lib/otel/metrics";
import type { GitHubRepo } from "@/lib/r2/types";

export const metadata: Metadata = {
  title: "GitHub Projects",
};

async function getRepos(): Promise<GitHubRepo[]> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/github`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function GitHubPage() {
  try { recordPageView("github"); } catch {}
  const [repos, t] = await Promise.all([getRepos(), getTranslations("GitHub")]);

  const username = process.env.GITHUB_USERNAME ?? "";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
            <Github className="w-6 h-6 text-ink-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-primary">
              {t("title")}
            </h1>
            <p className="text-ink-muted text-sm mt-0.5">
              {t("repoCount", { count: repos.length })}
            </p>
          </div>
        </div>

        {username && (
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border
                       text-sm text-ink-secondary hover:text-ink-primary hover:border-accent/40
                       transition-all duration-150 bg-surface-2 hover:bg-surface-3"
          >
            <Github className="w-4 h-4" />
            github.com/{username}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        )}
      </div>

      {repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-muted">
          <Github className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg">{t("emptyHeading")}</p>
          <p className="text-sm mt-1">{t("emptyHint")}</p>
        </div>
      ) : (
        <RepoGrid repos={repos} />
      )}
    </div>
  );
}
