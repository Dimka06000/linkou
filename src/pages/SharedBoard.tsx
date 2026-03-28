import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadPublicBoard } from "../hooks/useBoards";
import { LinkCard } from "../components/LinkCard";
import type { Board, Link } from "../types";

export function SharedBoard() {
  const { slug } = useParams<{ slug: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadPublicBoard(slug).then((result) => {
      if (!result) {
        setNotFound(true);
      } else {
        setBoard(result.board);
        setLinks(result.links);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (notFound || !board) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-200 mb-2">Board introuvable</h1>
        <p className="text-gray-500 text-sm">Ce board n'existe pas ou n'est pas public.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <header className="border-b border-[#2a2a2a] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-lg font-bold tracking-tight mb-1">
            Lin<span className="text-indigo-500">kou</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">{board.name}</h1>
          {board.description && (
            <p className="text-sm text-gray-400 mt-1">{board.description}</p>
          )}
          <p className="text-xs text-gray-600 mt-2">
            {links.length} lien{links.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        {links.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-10">Aucun lien dans ce board.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onTogglePin={() => {}}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
