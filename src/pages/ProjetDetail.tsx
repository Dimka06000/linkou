import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";

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

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjetDetail() {
  const { name } = useParams<{ name: string }>();
  const { projects, loading } = useProjects();
  const navigate = useNavigate();

  if (loading) {
    return <p className="text-gray-500 text-center py-12">Chargement...</p>;
  }

  const project = projects.find((p) => p.name === decodeURIComponent(name ?? ""));

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Projet introuvable.</p>
        <button
          onClick={() => navigate("/projets")}
          className="text-indigo-400 hover:underline text-sm"
        >
          ← Retour aux projets
        </button>
      </div>
    );
  }

  const status = STATUS_STYLES[project.deployStatus];
  const langClass = LANGUAGE_COLORS[project.language] ?? "bg-gray-500/20 text-gray-400";
  const vscodePath = VSCODE_PATHS[project.name];

  const vercelDashboardUrl = project.platform === "vercel" && project.prodUrl
    ? `https://vercel.com/dashboard`
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/projets")}
        className="text-sm text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
      >
        ← Projets
      </button>

      {/* Header */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status.dot}`} />
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                project.platform === "railway"
                  ? "bg-purple-500/15 text-purple-400"
                  : "bg-gray-500/15 text-gray-400"
              }`}>
                {project.platform === "railway" ? "Railway" : "Vercel"}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 pl-5">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {project.language && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${langClass}`}>
                {project.language}
              </span>
            )}
            {project.stars > 0 && (
              <span className="text-xs text-gray-500">★ {project.stars}</span>
            )}
            <span className={`text-sm ${status.labelClass} flex items-center gap-1`}>
              {status.label}
              {project.deployDate && (
                <span className="text-gray-600 text-xs">· {timeAgo(project.deployDate)}</span>
              )}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
            >
              GitHub
            </a>
          )}
          {project.prodUrl && (
            <a
              href={project.prodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Prod →
            </a>
          )}
          {vscodePath && (
            <a
              href={`vscode://file/${vscodePath}`}
              className="text-sm px-4 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Ouvrir dans VS Code
            </a>
          )}
        </div>
      </div>

      {/* Liens */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Liens</h2>
        <div className="space-y-2">
          {project.repoUrl && (
            <LinkRow icon="⬡" label="GitHub" href={project.repoUrl} />
          )}
          {project.prodUrl && (
            <LinkRow icon="🌐" label="Production" href={project.prodUrl} />
          )}
          {vercelDashboardUrl && (
            <LinkRow icon="▲" label="Dashboard Vercel" href={vercelDashboardUrl} />
          )}
          {project.platform === "railway" && (
            <LinkRow icon="🚄" label="Dashboard Railway" href="https://railway.app/dashboard" />
          )}
        </div>
      </div>

      {/* Derniers commits */}
      {project.commits && project.commits.length > 0 && (
        <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Derniers commits
          </h2>
          <div className="space-y-2">
            {project.commits.map((commit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 border-b border-[#1e1e1e] last:border-0"
              >
                <code className="text-[0.65rem] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                  {commit.sha}
                </code>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{commit.message}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {commit.author}{commit.date ? ` · ${formatDate(commit.date)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Config</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ConfigRow label="Plateforme" value={project.platform === "railway" ? "Railway" : "Vercel"} />
          {project.language && <ConfigRow label="Langage" value={project.language} />}
          {project.deployDate && <ConfigRow label="Dernier deploy" value={timeAgo(project.deployDate)} />}
          <ConfigRow label="Statut" value={status.label} />
        </div>
      </div>
    </div>
  );
}

function LinkRow({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[#1e1e1e] transition-colors group"
    >
      <span className="text-base">{icon}</span>
      <span className="text-sm text-gray-400 group-hover:text-indigo-400 transition-colors flex-1">{label}</span>
      <span className="text-xs text-gray-600 group-hover:text-indigo-400 transition-colors truncate max-w-[200px]">
        {href.replace(/^https?:\/\//, "").split("/").slice(0, 3).join("/")}
      </span>
    </a>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-sm text-gray-300 font-medium">{value}</span>
    </div>
  );
}
