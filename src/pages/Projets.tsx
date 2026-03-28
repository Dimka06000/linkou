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
  if (minutes < 60) return `il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function openVSCode(projectName: string) {
  const path = VSCODE_PATHS[projectName];
  if (path) {
    window.location.href = `vscode://file/${path}`;
  }
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const status = STATUS_STYLES[project.deployStatus];
  const langClass = LANGUAGE_COLORS[project.language] ?? "bg-gray-500/20 text-gray-400";
  const hasVSCode = !!VSCODE_PATHS[project.name];

  return (
    <div
      onClick={onClick}
      className="bg-[#161616] border border-[#1e1e1e] hover:border-indigo-500/30 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] flex flex-col gap-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
          <h3 className="font-bold text-base truncate">{project.name}</h3>
        </div>
        <span className={`text-[0.65rem] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
          project.platform === "railway"
            ? "bg-purple-500/15 text-purple-400"
            : "bg-gray-500/15 text-gray-400"
        }`}>
          {project.platform === "railway" ? "Railway" : "Vercel"}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-gray-500 truncate">{project.description}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        {project.language && (
          <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-medium ${langClass}`}>
            {project.language}
          </span>
        )}
        {project.stars > 0 && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            ★ {project.stars}
          </span>
        )}
        {project.lastCommit.message && (
          <span className="text-xs text-gray-500 truncate max-w-[200px]">
            "{project.lastCommit.message}"
          </span>
        )}
      </div>

      {/* Deploy row */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex items-center gap-1 ${status.labelClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        {project.deployDate && (
          <span className="text-gray-600">{timeAgo(project.deployDate)}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.7rem] px-2.5 py-1 rounded-lg bg-[#1e1e1e] hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
          >
            GitHub
          </a>
        )}
        {project.prodUrl && (
          <a
            href={project.prodUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.7rem] px-2.5 py-1 rounded-lg bg-[#1e1e1e] hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
          >
            Prod
          </a>
        )}
        {hasVSCode && (
          <button
            onClick={() => openVSCode(project.name)}
            className="text-[0.7rem] px-2.5 py-1 rounded-lg bg-[#1e1e1e] hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
          >
            VS Code
          </button>
        )}
      </div>
    </div>
  );
}

export function Projets() {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();

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

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Projets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.name}
            project={project}
            onClick={() => navigate(`/projets/${encodeURIComponent(project.name)}`)}
          />
        ))}
      </div>
    </div>
  );
}
