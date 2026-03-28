import { useState } from "react";
import type { Category, Link } from "../types";
import { LinkCard } from "./LinkCard";
import { useAppStore } from "../store";

interface Props {
  category: Category;
  onTogglePin: (id: string) => void;
  onLinkClick: (link: Link) => void;
}

export function CategorySection({ category, onTogglePin, onLinkClick }: Props) {
  const [collapsed, setCollapsed] = useState(category.isCollapsed);
  const searchQuery = useAppStore((s) => s.searchQuery);

  const filteredLinks = category.links.filter((link) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return link.name.toLowerCase().includes(q) || link.url.toLowerCase().includes(q);
  });

  if (searchQuery && filteredLinks.length === 0) return null;
  const isCollapsed = searchQuery ? false : collapsed;

  return (
    <div className="mb-5 bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-[#1e1e1e] transition-colors"
      >
        <span className="text-sm font-semibold">{category.icon} {category.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded-full">{category.links.length}</span>
          <span className={`text-gray-500 text-sm transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>▼</span>
        </div>
      </button>
      {!isCollapsed && (
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredLinks.map((link) => (
            <LinkCard key={link.id} link={link} onTogglePin={onTogglePin} onClick={onLinkClick} />
          ))}
        </div>
      )}
    </div>
  );
}
