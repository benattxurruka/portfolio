import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { fetchGitHubRepos } from "@/lib/github/repos";
import { logger } from "@/lib/otel/logger";

export const revalidate = 3600;

export async function GET() {
  if (!process.env.GITHUB_USERNAME) {
    return NextResponse.json(
      { error: "GITHUB_USERNAME is not configured" },
      { status: 500 }
    );
  }

  try {
    const repos = await fetchGitHubRepos();
    return NextResponse.json(repos, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[github] API request failed", { error: msg });
    Sentry.captureException(err);
    const status = msg.includes("GitHub API returned")
      ? parseInt(msg.replace("GitHub API returned ", ""), 10)
      : 500;
    return NextResponse.json(
      { error: msg },
      { status: isNaN(status) ? 500 : status }
    );
  }
}
