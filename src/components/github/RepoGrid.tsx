import { RepoCard } from "./RepoCard";
import type { GitHubRepo } from "@/lib/r2/types";

interface Props {
  repos: GitHubRepo[];
}

export function RepoGrid({ repos }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
