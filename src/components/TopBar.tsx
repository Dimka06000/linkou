import { useAppStore } from "../store";
import { useAuth } from "../hooks/useAuth";

export function TopBar() {
  const { setSidebarOpen, setCommandPaletteOpen } = useAppStore();
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e1e] sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-xl z-30">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">☰</button>
        <button onClick={() => setCommandPaletteOpen(true)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-gray-500 hover:border-[#3a3a3a] transition-colors w-[300px] md:w-[400px] text-left">
          ⌘K Rechercher partout...
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">{dateStr} · {timeStr}</span>
        {user && (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold">
            {user.email?.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
