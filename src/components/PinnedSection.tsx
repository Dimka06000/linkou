import type { Category, Link } from "../types";
import { LinkCard } from "./LinkCard";

interface Props {
  categories: Category[];
  onTogglePin: (id: string) => void;
  onLinkClick: (link: Link) => void;
}

export function PinnedSection({ categories, onTogglePin, onLinkClick }: Props) {
  const pinnedLinks = categories.flatMap((c) => c.links.filter((l) => l.isPinned));
  if (pinnedLinks.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">★ Favoris</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {pinnedLinks.map((link) => (
          <LinkCard key={link.id} link={link} onTogglePin={onTogglePin} onClick={onLinkClick} />
        ))}
      </div>
    </div>
  );
}
