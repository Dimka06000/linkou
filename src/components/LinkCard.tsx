import type { Link } from "../types";

interface Props {
  link: Link;
  onTogglePin: (id: string) => void;
  onClick: (link: Link) => void;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return ""; }
}

const BADGE_STYLES = {
  prod: "bg-green-500/15 text-green-400",
  test: "bg-amber-500/15 text-amber-400",
  staging: "bg-blue-500/15 text-blue-400",
} as const;

export function LinkCard({ link, onTogglePin, onClick }: Props) {
  const domain = getDomain(link.url);
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : "";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => { onClick(link); }}
      className="flex items-center gap-3 px-3.5 py-2.5 bg-[#1e1e1e] rounded-lg border border-transparent hover:border-indigo-500 hover:bg-[#1a1a2e] transition-all group"
    >
      {favicon && (
        <img src={favicon} alt="" className="w-6 h-6 rounded flex-shrink-0" loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate flex items-center gap-1.5">
          {link.name}
          {link.badge && (
            <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${BADGE_STYLES[link.badge]}`}>
              {link.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">{domain}</div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(link.id); }}
        className={`text-lg flex-shrink-0 transition-colors ${link.isPinned ? "text-yellow-400" : "text-[#2a2a2a] hover:text-yellow-400"}`}
      >
        ★
      </button>
    </a>
  );
}
