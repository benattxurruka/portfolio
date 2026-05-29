import type { GitHubRepo } from "@/lib/r2/types";
import { resolveGitHubAuthHeader } from "./auth";

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    throw new Error("GITHUB_USERNAME is not configured");
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const auth = await resolveGitHubAuthHeader();
  if (auth) {
    headers["Authorization"] = auth;
  }

  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`,
    {
      headers,
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const repos: GitHubRepo[] = await response.json();
  return repos.filter((r) => !r.fork && !r.archived);
}
