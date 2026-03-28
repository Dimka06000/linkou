import { NavLink, useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <header className="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">
              Lin<span className="text-indigo-500">kou</span>
            </div>
            <div className="flex items-center gap-1">
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
                {user && (
                  <>
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
                    <NavLink
                      to="/boards"
                      className={({ isActive }) =>
                        `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                        }`
                      }
                    >
                      Boards
                    </NavLink>
                    <NavLink
                      to="/settings"
                      className={({ isActive }) =>
                        `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e]"
                        }`
                      }
                    >
                      Parametres
                    </NavLink>
                  </>
                )}
              </nav>
              <div className="ml-2 pl-2 border-l border-[#2a2a2a]">
                {user ? (
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                    }}
                    className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#1e1e1e] transition-colors"
                  >
                    Deconnexion
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                      }`
                    }
                  >
                    Connexion
                  </NavLink>
                )}
              </div>
            </div>
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
