import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../types";

// ─── Config ────────────────────────────────────────────────────────────────

interface ProjectConfig {
  icon: string;
  tagline: string;
  gradient: string;
  vscodePath: string;
  supabaseRef?: string;
  prodUrl?: string;
  vercelProject?: string;
}

const PROJECTS_CONFIG: Record<string, ProjectConfig> = {
  Statera: {
    icon: "🏥",
    tagline: "Plateforme sante intelligente",
    gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    vscodePath: "c:/Users/dimit/OneDrive/Documents/Personnel/Santé/Projets Santé/Statera",
    supabaseRef: "oxaqkcqdtjzeqddcwqgh",
    prodUrl: "https://statera.vercel.app",
  },
  "tips-platform": {
    icon: "📊",
    tagline: "Trading algorithmique & IA",
    gradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    vscodePath:
      "c:/Users/dimit/OneDrive/Documents/Projets et Entreprises/Projets perso/Coding/Tradingbot/tips-platform",
    prodUrl: "https://trading-bot-six-topaz.vercel.app",
  },
  Elaubody: {
    icon: "💆",
    tagline: "Booking & planning beaute",
    gradient: "from-rose-500/15 via-pink-500/5 to-transparent",
    vscodePath:
      "c:/Users/dimit/OneDrive/Documents/Projets et Entreprises/Projets perso/Coding/Elaubody",
    supabaseRef: "dbercrkcbyurwjubhjvj",
  },
  linkou: {
    icon: "🚀",
    tagline: "Cockpit personnel Jarvis",
    gradient: "from-indigo-500/15 via-purple-500/5 to-transparent",
    vscodePath:
      "c:/Users/dimit/OneDrive/Documents/Projets et Entreprises/Projets perso/Coding/Linkou",
    supabaseRef: "fogynuropiwrszdtmwpq",
    prodUrl: "https://linkou-lemon.vercel.app",
  },
};

const DEFAULT_CONFIG: ProjectConfig = {
  icon: "💻",
  tagline: "",
  gradient: "from-gray-500/10 via-gray-500/5 to-transparent",
  vscodePath: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "--";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "maintenant";
  if (minutes < 60) return `il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function countCommitsToday(commits: Project["commits"]): number {
  const today = new Date().toDateString();
  return commits.filter((c) => new Date(c.date).toDateString() === today).length;
}

const STATUS_STYLES = {
  ready: {
    dot: "bg-green-400 animate-pulse",
    label: "Ready",
    labelClass: "text-green-400",
  },
  building: {
    dot: "bg-amber-400 animate-pulse",
    label: "Building...",
    labelClass: "text-amber-400",
  },
  error: {
    dot: "bg-red-400",
    label: "Erreur",
    labelClass: "text-red-400",
  },
  unknown: {
    dot: "bg-gray-600",
    label: "Inconnu",
    labelClass: "text-gray-500",
  },
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "text-blue-400",
  JavaScript: "text-yellow-400",
  Python: "text-yellow-300",
  Rust: "text-orange-400",
  Go: "text-cyan-400",
  CSS: "text-pink-400",
  HTML: "text-orange-300",
};

// ─── ProjectCard ────────────────────────────────────────────────────────────

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
  const cfg =
    PROJECTS_CONFIG[project.name] ||
    PROJECTS_CONFIG[project.name.toLowerCase()] ||
    DEFAULT_CONFIG;

  const status = STATUS_STYLES[project.deployStatus];
  const langColor = LANGUAGE_COLORS[project.language] ?? "text-gray-400";
  const commitsToday = countCommitsToday(project.commits ?? []);
  const last3Commits = (project.commits ?? []).slice(0, 3);

  // Resolve prod URL: config overrides hook data
  const prodUrl = cfg.prodUrl || project.prodUrl;

  // Vercel dashboard link
  const vercelUrl =
    project.platform === "vercel"
      ? `https://vercel.com/dimis-projects-998fd45e/${project.name}`
      : null;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 ${
        isFavorite
          ? "border-indigo-500/40 bg-[#161616]"
          : "border-[#1e1e1e] bg-[#161616] hover:border-indigo-500/20"
      }`}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} pointer-events-none`}
      />

      <div className="relative p-6 flex flex-col gap-5">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + name + tagline */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl leading-none">{cfg.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-lg text-white">{project.name}</h3>
                {project.language && (
                  <span className={`text-xs font-medium ${langColor}`}>
                    {project.language}
                  </span>
                )}
                <span className="text-gray-600 text-xs">·</span>
                <span className="text-xs text-gray-500">
                  {project.platform === "railway" ? "Railway" : "Vercel"}
                </span>
                <span className="text-gray-600 text-xs">·</span>
                <span className={`flex items-center gap-1.5 text-xs ${status.labelClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              {cfg.tagline && (
                <p className="text-sm text-gray-500 mt-0.5">{cfg.tagline}</p>
              )}
            </div>
          </div>

          {/* Right: favorite star */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`text-2xl transition-colors flex-shrink-0 leading-none ${
              isFavorite
                ? "text-yellow-400"
                : "text-[#2a2a2a] hover:text-yellow-400"
            }`}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            ★
          </button>
        </div>

        {/* ── Mini-stat boxes ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Deploy */}
          <div className="bg-black/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-lg">🚀</span>
            <span className="text-xs text-gray-500 font-medium">Deploy</span>
            <span className={`text-sm font-semibold ${status.labelClass}`}>
              {status.label}
            </span>
            <span className="text-xs text-gray-600">
              {project.deployDate ? timeAgo(project.deployDate) : "--"}
            </span>
          </div>

          {/* Commits */}
          <div className="bg-black/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-lg">📝</span>
            <span className="text-xs text-gray-500 font-medium">Commits</span>
            <span className="text-sm font-semibold text-white">
              {commitsToday > 0 ? `${commitsToday} aujourd'hui` : "Aucun aujourd'hui"}
            </span>
            <span className="text-xs text-gray-600">branche main</span>
          </div>

          {/* Database */}
          <div className="bg-black/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-lg">🗄️</span>
            <span className="text-xs text-gray-500 font-medium">Database</span>
            <span className="text-sm font-semibold text-gray-400">--</span>
            <span className="text-xs text-gray-600">
              {cfg.supabaseRef ? "Supabase" : "N/A"}
            </span>
          </div>

          {/* Traffic */}
          <div className="bg-black/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-lg">📈</span>
            <span className="text-xs text-gray-500 font-medium">Trafic</span>
            <span className="text-sm font-semibold text-gray-400">--</span>
            <span className="text-xs text-gray-600">Analytics bientôt</span>
          </div>
        </div>

        {/* ── Recent commits ── */}
        {last3Commits.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {last3Commits.map((commit) => (
              <div
                key={commit.sha}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-black/10"
              >
                <span className="font-mono text-xs text-indigo-400 flex-shrink-0 w-14">
                  {commit.sha}
                </span>
                <span className="text-sm text-gray-400 truncate flex-1">
                  {commit.message}
                </span>
                <span className="text-xs text-gray-600 flex-shrink-0">
                  {timeAgo(commit.date)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div
          className="flex items-center gap-2 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {cfg.vscodePath && (
            <a
              href={`vscode://file/${cfg.vscodePath}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              💻 VS Code
            </a>
          )}
          {prodUrl && (
            <a
              href={prodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              🌐 Prod
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              🐙 GitHub
            </a>
          )}
          {vercelUrl && (
            <a
              href={vercelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              ▲ Vercel
            </a>
          )}
          {project.platform === "railway" && (
            <a
              href="https://railway.app/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              🚂 Railway
            </a>
          )}
          {cfg.supabaseRef && (
            <a
              href={`https://supabase.com/dashboard/project/${cfg.supabaseRef}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              🗄 Supabase
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function Projets() {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("linkou-fav-projects") || "[]"
      );
      return new Set(stored);
    } catch {
      return new Set();
    }
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

  if (loading) {
    return (
      <p className="text-gray-500 text-center py-12">
        Chargement des projets...
      </p>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Projets</h2>
        <p className="text-gray-500">
          Connecte GitHub et Vercel dans{" "}
          <a href="/integrations" className="text-indigo-400 hover:underline">
            Integrations
          </a>
        </p>
      </div>
    );
  }

  const favProjects = projects.filter((p) => favorites.has(p.name));
  const otherProjects = projects.filter((p) => !favorites.has(p.name));

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Projets</h2>

      {/* Favoris */}
      {favProjects.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            ★ Favoris
          </h3>
          <div className="flex flex-col gap-4">
            {favProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() =>
                  navigate(`/projets/${encodeURIComponent(project.name)}`)
                }
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(project.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Autres projets */}
      {otherProjects.length > 0 && (
        <div>
          {favProjects.length > 0 && (
            <h3 className="text-sm font-semibold text-gray-500 mb-4">
              Autres projets
            </h3>
          )}
          <div className="flex flex-col gap-4">
            {otherProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() =>
                  navigate(`/projets/${encodeURIComponent(project.name)}`)
                }
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
