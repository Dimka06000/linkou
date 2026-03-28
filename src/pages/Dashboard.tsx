import { useEffect, useState } from "react";
import type { Category, Link } from "../types";
import { loadCategories, saveClick } from "../lib/storage";
import { BriefingCard } from "../components/BriefingCard";
import { useAuth } from "../hooks/useAuth";
import { useBriefing } from "../hooks/useBriefing";
import { useProjects } from "../hooks/useProjects";
import { useCalendar } from "../hooks/useCalendar";

const STATUS_DOT: Record<string, string> = {
  ready: "bg-green-400",
  building: "bg-amber-400 animate-pulse",
  error: "bg-red-400",
  unknown: "bg-gray-600",
};

export function Dashboard() {
  const { user } = useAuth();
  const briefing = useBriefing();
  const { projects } = useProjects();
  const today = new Date().toISOString().split("T")[0];
  const { events } = useCalendar(today);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories(user?.id).then(setCategories);
  }, [user]);

  const pinnedLinks = categories.flatMap((c) => c.links.filter((l) => l.isPinned));

  const [topLinks, setTopLinks] = useState<Link[]>([]);
  useEffect(() => {
    const clicks = JSON.parse(localStorage.getItem("linkou-clicks") || "[]");
    const countMap: Record<string, number> = {};
    clicks.forEach((c: any) => { countMap[c.linkId] = (countMap[c.linkId] || 0) + 1; });
    const allLinks = categories.flatMap((c) => c.links);
    const sorted = allLinks.map((l) => ({ ...l, count: countMap[l.id] || 0 })).sort((a, b) => b.count - a.count).slice(0, 8);
    setTopLinks(sorted);
  }, [categories]);

  function handleLinkClick(link: Link) {
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    saveClick({ linkId: link.id, clickedAt: new Date().toISOString(), device });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <BriefingCard briefing={briefing} />

      {/* Top links */}
      {topLinks.length > 0 && (
        <div className="col-span-full md:col-span-2 bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Les plus utilises</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topLinks.map((link) => {
              const domain = (() => { try { return new URL(link.url).hostname; } catch { return ""; } })();
              const favicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : "";
              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => handleLinkClick(link)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#1e1e2e] border border-transparent hover:border-indigo-500/30 transition-all">
                  {favicon && <img src={favicon} alt="" className="w-6 h-6 rounded" loading="lazy" />}
                  <span className="text-xs text-center truncate w-full">{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Favoris */}
      {pinnedLinks.length > 0 && (
        <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3 text-yellow-400">★ Favoris</h3>
          <div className="space-y-1">
            {pinnedLinks.slice(0, 6).map((link) => {
              const domain = (() => { try { return new URL(link.url).hostname; } catch { return ""; } })();
              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => handleLinkClick(link)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4" loading="lazy" />
                  <span className="text-sm truncate">{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Planning du jour */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">📅 Aujourd'hui</h3>
          <a href="/planning" className="text-xs text-indigo-400">Voir planning →</a>
        </div>
        {events.length > 0 ? (
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                <span className="text-xs text-indigo-400 font-semibold w-12 flex-shrink-0">{formatTime(event.start)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{event.title}</div>
                  {event.location && <div className="text-xs text-gray-500 truncate">📍 {event.location}</div>}
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.source === "google" ? "bg-blue-400" : "bg-orange-400"}`} />
              </div>
            ))}
            {events.length > 5 && <p className="text-xs text-gray-500">+{events.length - 5} autres</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {user ? "Aucun rdv aujourd'hui" : "Connecte-toi pour voir ton planning"}
          </p>
        )}
      </div>

      {/* Projets dev */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">💻 Projets</h3>
          <a href="/projets" className="text-xs text-indigo-400">Voir tout →</a>
        </div>
        {projects.length > 0 ? (
          <div className="space-y-2">
            {projects.slice(0, 5).map((project) => (
              <div key={project.name} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[project.deployStatus] || STATUS_DOT.unknown}`} />
                <a href={project.repoUrl} target="_blank" rel="noopener" className="text-sm flex-1 truncate hover:text-indigo-400 transition-colors">
                  {project.name}
                </a>
                {project.deployDate && (
                  <span className="text-xs text-gray-600">{timeAgo(project.deployDate)}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {user ? "Connecte GitHub dans Integrations" : "Connecte-toi pour voir tes projets"}
          </p>
        )}
      </div>
    </div>
  );
}
