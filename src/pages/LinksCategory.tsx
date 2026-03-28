import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Category, Link } from "../types";
import { loadCategories, saveClick } from "../lib/storage";
import { LinkCard } from "../components/LinkCard";
import { useAuth } from "../hooks/useAuth";

export function LinksCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories(user?.id).then((cats) => {
      setCategory(cats.find((c) => c.id === categoryId) || null);
    });
  }, [categoryId, user]);

  if (!category) return <p className="text-gray-500 text-center py-12">Categorie introuvable.</p>;

  function handleTogglePin(linkId: string) {
    const pinned = JSON.parse(localStorage.getItem("linkou-pinned") || "{}");
    pinned[linkId] = !pinned[linkId];
    if (!pinned[linkId]) delete pinned[linkId];
    localStorage.setItem("linkou-pinned", JSON.stringify(pinned));
    loadCategories(user?.id).then((cats) => setCategory(cats.find((c) => c.id === categoryId) || null));
  }

  function handleLinkClick(link: Link) {
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    saveClick({ linkId: link.id, clickedAt: new Date().toISOString(), device });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{category.icon} {category.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {category.links.map((link) => (
          <LinkCard key={link.id} link={link} onTogglePin={handleTogglePin} onClick={handleLinkClick} />
        ))}
      </div>
      {category.links.length === 0 && <p className="text-gray-500 text-center py-8">Aucun lien dans cette categorie.</p>}
    </div>
  );
}
