import { useState } from "react";
import { useBoards } from "../hooks/useBoards";
import { useAuth } from "../hooks/useAuth";
import type { Board } from "../types";

function BoardCard({
  board,
  onTogglePublic,
  onDelete,
}: {
  board: Board;
  onTogglePublic: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/board/${board.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-100 truncate">{board.name}</h3>
          {board.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{board.description}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-600 hover:text-red-400 transition-colors text-lg flex-shrink-0"
          title="Supprimer"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="font-mono truncate">/board/{board.slug}</span>
        <span>·</span>
        <span>{board.linkIds.length} lien{board.linkIds.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onTogglePublic}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            board.isPublic
              ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
              : "bg-[#1e1e1e] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
          }`}
        >
          <span>{board.isPublic ? "● Public" : "○ Prive"}</span>
        </button>

        {board.isPublic && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] hover:border-indigo-500 text-gray-400 hover:text-indigo-400 transition-colors"
          >
            {copied ? "✓ Copie !" : "Copier le lien"}
          </button>
        )}
      </div>
    </div>
  );
}

export function Boards() {
  const { user } = useAuth();
  const { boards, loading, createBoard, toggleBoardPublic, deleteBoard } = useBoards(user?.id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await createBoard(name.trim(), description.trim());
    setName("");
    setDescription("");
    setShowForm(false);
    setCreating(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Boards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Regroupez des liens et partagez-les via un lien public.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nouveau board
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-[#161616] border border-indigo-500/30 rounded-xl p-5 mb-6 flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold text-gray-300">Nouveau board</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du board"
            className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500"
            required
            autoFocus
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {creating ? "Creation..." : "Creer"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-4 py-2 rounded-lg bg-[#1e1e1e] text-gray-400 hover:text-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Chargement...</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-medium text-gray-400 mb-2">Aucun board</p>
          <p className="text-sm">Creez votre premier board pour partager des liens.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onTogglePublic={() => toggleBoardPublic(board.id)}
              onDelete={() => deleteBoard(board.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
