import { Star, GitFork, ExternalLink, Globe } from "lucide-react";
import type { GitHubRepo } from "@/lib/r2/types";
import { cn } from "@/lib/utils/cn";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Rust: "bg-orange-500",
  Go: "bg-cyan-400",
  Ruby: "bg-red-500",
  Java: "bg-red-400",
  "C#": "bg-purple-500",
  "C++": "bg-pink-500",
  Shell: "bg-gray-400",
};

interface Props {
  repo: GitHubRepo;
}

export function RepoCard({ repo }: Props) {
  const langColor = repo.language
    ? LANGUAGE_COLORS[repo.language] ?? "bg-ink-muted"
    : null;

  const updatedAt = new Date(repo.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-5 flex flex-col gap-3 group"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink-primary group-hover:text-accent transition-colors truncate">
          {repo.name}
        </h3>
        <ExternalLink className="w-3.5 h-3.5 text-ink-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-sm text-ink-secondary line-clamp-2 flex-1">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 4).map((topic) => (
            <span key={topic} className="tag text-[11px]">
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-ink-muted mt-auto pt-1">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", langColor)} />
            {repo.language}
          </span>
        )}

        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {repo.stargazers_count.toLocaleString()}
          </span>
        )}

        {repo.forks_count > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />
            {repo.forks_count.toLocaleString()}
          </span>
        )}

        {repo.homepage && (
          <span className="flex items-center gap-1 ml-auto">
            <Globe className="w-3 h-3" />
            Site
          </span>
        )}

        <span className="ml-auto">{updatedAt}</span>
      </div>
    </a>
  );
}
