import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store";
import type { Category } from "../types";
import { useEffect, useState } from "react";
import { loadCategories } from "../lib/storage";

const MAIN_LINKS = [
  { to: "/", icon: "🏠", label: "Dashboard", end: true },
  { to: "/planning", icon: "📅", label: "Planning" },
  { to: "/projets", icon: "💻", label: "Projets" },
];

const AUTH_LINKS = [
  { to: "/stats", icon: "📊", label: "Stats" },
  { to: "/boards", icon: "📋", label: "Boards" },
];

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories(user?.id).then(setCategories);
  }, [user]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-indigo-500/12 text-indigo-400"
        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
    }`;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#111] border-r border-[#1e1e1e] flex flex-col z-50 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-5 border-b border-[#1e1e1e]">
          <div className="text-xl font-bold tracking-tight">
            Lin<span className="text-indigo-500">kou</span>
          </div>
          {user && <div className="text-xs text-gray-500 mt-1">{user.email}</div>}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="mb-4">
            <div className="px-3 mb-1 text-[0.65rem] text-gray-600 uppercase tracking-wider">Principal</div>
            {MAIN_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}>
                <span className="w-5 text-center">{link.icon}</span>{link.label}
              </NavLink>
            ))}
            {user && AUTH_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}>
                <span className="w-5 text-center">{link.icon}</span>{link.label}
              </NavLink>
            ))}
          </div>
          <div>
            <div className="px-3 mb-1 text-[0.65rem] text-gray-600 uppercase tracking-wider">Liens rapides</div>
            {categories.map((cat) => (
              <NavLink key={cat.id} to={`/links/${cat.id}`} className={navClass}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}>
                <span className="w-5 text-center">{cat.icon}</span>
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto text-[0.65rem] text-gray-600">{cat.links.length}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="px-2 py-3 border-t border-[#1e1e1e] space-y-1">
          <NavLink to="/settings" className={navClass}><span className="w-5 text-center">⚙️</span> Parametres</NavLink>
          <NavLink to="/integrations" className={navClass}><span className="w-5 text-center">🔗</span> Integrations</NavLink>
          {!user && <NavLink to="/login" className={navClass}><span className="w-5 text-center">👤</span> Connexion</NavLink>}
        </div>
      </aside>
    </>
  );
}
