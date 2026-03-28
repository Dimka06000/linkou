import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../types";

const STATUS_STYLES = {
  ready: { dot: "bg-green-400", label: "Deploye", labelClass: "text-green-400" },
  building: { dot: "bg-amber-400 animate-pulse", label: "Building...", labelClass: "text-amber-400" },
  error: { dot: "bg-red-400", label: "Erreur", labelClass: "text-red-400" },
  unknown: { dot: "bg-gray-600", label: "Inconnu", labelClass: "text-gray-500" },
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500/20 text-blue-400",
  JavaScript: "bg-yellow-500/20 text-yellow-400",
  Python: "bg-yellow-400/20 text-yellow-300",
  Rust: "bg-orange-500/20 text-orange-400",
  Go: "bg-cyan-500/20 text-cyan-400",
  CSS: "bg-pink-500/20 text-pink-400",
  HTML: "bg-orange-400/20 text-orange-300",
};

const PROJECT_GRADIENTS: Record<string, string> = {
  Statera: "from-emerald-600/20 via-teal-600/10 to-transparent",
  "tips-platform": "from-amber-600/20 via-orange-600/10 to-transparent",
  Elaubody: "from-rose-600/20 via-pink-600/10 to-transparent",
  Linkou: "from-indigo-600/20 via-purple-600/10 to-transparent",
};

const PROJECT_ICONS: Record<string, string> = {
  Statera: "🏥",
  "tips-platform": "📊",
  Elaubody: "💆",
  Linkou: "🚀",
};

const PROJECT_TAGLINES: Record<string, string> = {
  Statera: "Plateforme sante intelligente",
  "tips-platform": "Trading algorithmique & IA",
  Elaubody: "Booking & planning",
  Linkou: "Cockpit personnel Jarvis",
};

const VSCODE_PATHS: Record<string, string> = {
  Statera: "c:/Users/dimit/OneDrive/Documents/Personnel/Santé/Projets Santé/Statera",
  "tips-platform": "c:/Users/dimit/OneDrive/Documents/Projets et Entreprises/Projets perso/Coding/Tradingbot/tips-platform",
  Elaubody: "c:/Users/dimit/OneDrive/Documents/Projets et Entreprises/Projets perso/Coding/Elaubody",
  Linkou: "c:/Users/dimit/OneDrive/Documents/Projets et Entreprises/Projets perso/Coding/Linkou",
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function ProjectCard({
  project,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  project: Project;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const status = STATUS_STYLES[project.deployStatus];
  const langClass = LANGUAGE_COLORS[project.language] ?? "bg-gray-500/20 text-gray-400";
  const gradient = PROJECT_GRADIENTS[project.name] || "from-gray-600/20 via-gray-600/10 to-transparent";
  const icon = PROJECT_ICONS[project.name] || "💻";
  const tagline = PROJECT_TAGLINES[project.name] || project.description || "";
  const hasVSCode = !!VSCODE_PATHS[project.name];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden border rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/5 ${
        isFavorite
          ? "border-indigo-500/40 bg-[#161616]"
          : "border-[#1e1e1e] bg-[#161616] hover:border-indigo-500/30"
      }`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

      <div className="relative p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{icon}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{project.name}</h3>
              <p className="text-xs text-gray-500">{tagline}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`text-xl transition-colors flex-shrink-0 ${
              isFavorite ? "text-yellow-400" : "text-[#2a2a2a] hover:text-yellow-400"
            }`}
          >
            ★
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-medium ${
            project.platform === "railway"
              ? "bg-purple-500/15 text-purple-400"
              : "bg-gray-500/15 text-gray-400"
          }`}>
            {project.platform === "railway" ? "Railway" : "Vercel"}
          </span>
          {project.language && (
            <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-medium ${langClass}`}>
              {project.language}
            </span>
          )}
          {project.stars > 0 && (
            <span className="text-xs text-gray-500">★ {project.stars}</span>
          )}
          <span className={`flex items-center gap-1 text-[0.65rem] ${status.labelClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Last commit */}
        {project.lastCommit.message && (
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-mono text-indigo-400">
                {project.commits?.[0]?.sha || "latest"}
              </span>
              <span className="text-xs text-gray-400 truncate">{project.lastCommit.message}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {project.lastCommit.author && (
                <span className="text-[0.6rem] text-gray-600">{project.lastCommit.author}</span>
              )}
              {project.deployDate && (
                <span className="text-[0.6rem] text-gray-600">deploye il y a {timeAgo(project.deployDate)}</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
              className="text-[0.7rem] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              🐙 GitHub
            </a>
          )}
          {project.prodUrl && (
            <a href={project.prodUrl} target="_blank" rel="noopener noreferrer"
              className="text-[0.7rem] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              🌐 Prod
            </a>
          )}
          {hasVSCode && (
            <button
              onClick={() => window.location.href = `vscode://file/${VSCODE_PATHS[project.name]}`}
              className="text-[0.7rem] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              💻 VS Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Projets() {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = JSON.parse(localStorage.getItem("linkou-fav-projects") || "[]");
    return new Set(stored);
  });

  function toggleFavorite(name: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      localStorage.setItem("linkou-fav-projects", JSON.stringify([...next]));
      return next;
    });
  }

  if (loading) return <p className="text-gray-500 text-center py-12">Chargement des projets...</p>;

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Projets</h2>
        <p className="text-gray-500">
          Connecte GitHub et Vercel dans{" "}
          <a href="/integrations" className="text-indigo-400 hover:underline">Integrations</a>
        </p>
      </div>
    );
  }

  const favProjects = projects.filter((p) => favorites.has(p.name));
  const otherProjects = projects.filter((p) => !favorites.has(p.name));

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Projets</h2>

      {/* Favoris */}
      {favProjects.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">★ Favoris</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() => navigate(`/projets/${encodeURIComponent(project.name)}`)}
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(project.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Autres */}
      {otherProjects.length > 0 && (
        <div>
          {favProjects.length > 0 && (
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Tous les projets</h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() => navigate(`/projets/${encodeURIComponent(project.name)}`)}
                isFavorite={false}
                onToggleFavorite={() => toggleFavorite(project.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
