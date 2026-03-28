import { useEffect, useState } from "react";
import type { Category, Link } from "../types";
import { loadCategories, saveClick } from "../lib/storage";
import { PinnedSection } from "../components/PinnedSection";
import { CategorySection } from "../components/CategorySection";
import { GitHubWidget } from "../components/GitHubWidget";
import { useFeature } from "../hooks/useFeature";
import { useAppStore } from "../store";

export function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const githubEnabled = useFeature("github");

  useEffect(() => {
    loadCategories().then(setCategories);
  }, []);

  function handleTogglePin(linkId: string) {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        links: cat.links.map((l) =>
          l.id === linkId ? { ...l, isPinned: !l.isPinned } : l
        ),
      }))
    );
    const pinned = JSON.parse(localStorage.getItem("linkou-pinned") || "{}");
    pinned[linkId] = !pinned[linkId];
    if (!pinned[linkId]) delete pinned[linkId];
    localStorage.setItem("linkou-pinned", JSON.stringify(pinned));
  }

  function handleLinkClick(link: Link) {
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    saveClick({ linkId: link.id, clickedAt: new Date().toISOString(), device });
  }

  const hasResults = categories.some((cat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return cat.links.some((l) => l.name.toLowerCase().includes(q) || l.url.toLowerCase().includes(q));
  });

  return (
    <>
      {githubEnabled && <GitHubWidget />}
      <PinnedSection categories={categories} onTogglePin={handleTogglePin} onLinkClick={handleLinkClick} />
      {categories.map((cat) => (
        <CategorySection key={cat.id} category={cat} onTogglePin={handleTogglePin} onLinkClick={handleLinkClick} />
      ))}
      {!hasResults && searchQuery && (
        <p className="text-center text-gray-500 py-12">Aucun lien ne correspond a ta recherche.</p>
      )}
    </>
  );
}
