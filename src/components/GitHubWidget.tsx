import { useEffect, useState } from "react";
import { fetchRecentRepos } from "../lib/github";

interface Repo {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500/20 text-blue-400",
  JavaScript: "bg-yellow-500/20 text-yellow-400",
  Python: "bg-green-500/20 text-green-400",
  Rust: "bg-orange-500/20 text-orange-400",
  Go: "bg-cyan-500/20 text-cyan-400",
  CSS: "bg-pink-500/20 text-pink-400",
  HTML: "bg-red-500/20 text-red-400",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

export function GitHubWidget() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentRepos()
      .then(setRepos)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          GitHub — Repos récents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (repos.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        GitHub — Repos récents
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {repos.map((repo) => {
          const langClass =
            LANGUAGE_COLORS[repo.language] || "bg-gray-500/20 text-gray-400";
          return (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-2 hover:border-indigo-500/40 hover:bg-[#1e1e2e] transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-gray-200 group-hover:text-indigo-300 truncate">
                  {repo.name}
                </span>
                <span
                  className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    repo.isPrivate
                      ? "bg-gray-700 text-gray-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {repo.isPrivate ? "Privé" : "Public"}
                </span>
              </div>

              {repo.description && (
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {repo.description}
                </p>
              )}

              <div className="mt-auto flex items-center gap-2 flex-wrap">
                {repo.language && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${langClass}`}
                  >
                    {repo.language}
                  </span>
                )}
                {repo.stars > 0 && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    ★ {repo.stars}
                  </span>
                )}
                <span className="text-[10px] text-gray-600 ml-auto">
                  {formatDate(repo.updatedAt)}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
