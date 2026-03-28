import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { loadCategories } from "../lib/storage";

interface SearchResult {
  type: "link" | "page" | "category";
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) { inputRef.current?.focus(); setQuery(""); setSelected(0); }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([
        { type: "page", icon: "🏠", title: "Dashboard", subtitle: "Page", action: () => navigate("/") },
        { type: "page", icon: "📅", title: "Planning", subtitle: "Page", action: () => navigate("/planning") },
        { type: "page", icon: "💻", title: "Projets", subtitle: "Page", action: () => navigate("/projets") },
        { type: "page", icon: "📊", title: "Stats", subtitle: "Page", action: () => navigate("/stats") },
      ]);
      return;
    }
    const q = query.toLowerCase();
    loadCategories().then((cats) => {
      const linkResults: SearchResult[] = [];
      cats.forEach((cat) => {
        cat.links.forEach((link) => {
          if (link.name.toLowerCase().includes(q) || link.url.toLowerCase().includes(q)) {
            linkResults.push({
              type: "link", icon: "🔗", title: link.name,
              subtitle: (() => { try { return new URL(link.url).hostname; } catch { return ""; } })(),
              action: () => window.open(link.url, "_blank"),
            });
          }
        });
      });
      setResults(linkResults.slice(0, 10));
      setSelected(0);
    });
  }, [query, navigate]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && results[selected]) { results[selected].action(); setCommandPaletteOpen(false); }
  }

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-lg bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
        <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Rechercher un lien, une page, un rdv..."
          className="w-full px-5 py-4 bg-transparent text-gray-200 text-sm outline-none border-b border-[#2a2a2a] placeholder:text-gray-500" />
        <div className="max-h-[300px] overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} onClick={() => { r.action(); setCommandPaletteOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition-colors ${
                i === selected ? "bg-indigo-500/10 text-indigo-400" : "text-gray-300 hover:bg-white/5"
              }`}>
              <span>{r.icon}</span><span className="flex-1">{r.title}</span>
              <span className="text-xs text-gray-600">{r.subtitle}</span>
            </button>
          ))}
          {results.length === 0 && query && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">Aucun resultat pour "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
