import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { GitHubRepo } from "@/lib/r2/types";
import { logger } from "@/lib/otel/logger";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    return NextResponse.json(
      { error: "GITHUB_USERNAME is not configured" },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const rawToken = process.env.GH_TOKEN;
  logger.info("[github] token debug", {
    present: !!rawToken,
    length: rawToken?.length ?? 0,
    prefix: rawToken?.slice(0, 4) ?? "",
    hasLeadingSpace: rawToken?.startsWith(" ") ?? false,
    hasTrailingSpace: rawToken?.endsWith(" ") ?? false,
  });

  if (rawToken) {
    headers["Authorization"] = `Bearer ${rawToken.trim()}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`,
      {
        headers,
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      const msg = `[github] API request failed with status ${response.status}`;
      logger.error(msg, { status: response.status, username });
      Sentry.captureMessage(msg, {
        level: "error",
        extra: { status: response.status, username },
      });
      return NextResponse.json(
        { error: `GitHub API returned ${response.status}` },
        { status: response.status }
      );
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter out forks and archived repos, keep only the public ones
    const filtered = repos.filter((r) => !r.fork && !r.archived);

    return NextResponse.json(filtered, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    logger.error("[github] Failed to fetch repos", { error: String(err) });
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
