import { NavLink } from "react-router-dom";
import { SearchBar } from "./SearchBar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <header className="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">
              Lin<span className="text-indigo-500">kou</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                  }`
                }
              >
                Stats
              </NavLink>
            </nav>
          </div>
          <SearchBar />
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
