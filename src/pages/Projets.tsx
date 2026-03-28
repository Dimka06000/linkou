import { useProjects } from "../hooks/useProjects";

const STATUS_STYLES = {
  ready: { dot: "bg-green-400", label: "Deploye", labelClass: "text-green-400" },
  building: { dot: "bg-amber-400 animate-pulse", label: "Building...", labelClass: "text-amber-400" },
  error: { dot: "bg-red-400", label: "Erreur", labelClass: "text-red-400" },
  unknown: { dot: "bg-gray-600", label: "Inconnu", labelClass: "text-gray-500" },
};

export function Projets() {
  const { projects, loading } = useProjects();

  if (loading) return <p className="text-gray-500 text-center py-12">Chargement des projets...</p>;

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">💻 Projets</h2>
        <p className="text-gray-500">Connecte GitHub et Vercel dans <a href="/integrations" className="text-indigo-400 hover:underline">Integrations</a></p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">💻 Projets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const status = STATUS_STYLES[project.deployStatus];
          return (
            <div key={project.name} className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{project.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-xs ${status.labelClass}`}>{status.label}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener" className="block text-gray-400 hover:text-indigo-400 truncate">
                    🐙 {project.repoUrl.replace("https://github.com/", "")}
                  </a>
                )}
                {project.prodUrl && (
                  <a href={project.prodUrl} target="_blank" rel="noopener" className="block text-gray-400 hover:text-indigo-400 truncate">
                    🌐 {project.prodUrl}
                  </a>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={`px-1.5 py-0.5 rounded text-[0.65rem] ${project.platform === "railway" ? "bg-purple-500/15 text-purple-400" : "bg-gray-500/15 text-gray-400"}`}>
                    {project.platform === "railway" ? "Railway" : "Vercel"}
                  </span>
                  {project.deployDate && (
                    <span>Dernier deploy: {new Date(project.deployDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
