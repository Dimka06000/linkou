import { useEffect, useState } from "react";
import type { Category, Link } from "../types";
import { loadCategories } from "../lib/storage";
import { isSaasMode } from "../hooks/useFeature";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

function generateId() {
  return crypto.randomUUID();
}

function saveLocalCategories(cats: Category[]) {
  localStorage.setItem("linkou-categories", JSON.stringify(cats));
}

export function Settings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📁");
  const [newLinks, setNewLinks] = useState<Record<string, { name: string; url: string }>>({});
  const [importError, setImportError] = useState("");
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadCategories(user?.id).then(setCategories);
  }, [user?.id]);

  async function persistCategories(updated: Category[]) {
    setCategories(updated);
    if (isSaasMode() && supabase && user) {
      // Handled via direct Supabase ops per action
      return;
    }
    saveLocalCategories(updated);
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    const cat: Category = {
      id: generateId(),
      name: newCatName.trim(),
      icon: newCatIcon || "📁",
      position: categories.length,
      isCollapsed: false,
      links: [],
    };
    if (isSaasMode() && supabase && user) {
      await supabase.from("categories").insert({ ...cat, user_id: user.id });
    }
    const updated = [...categories, cat];
    await persistCategories(updated);
    setNewCatName("");
    setNewCatIcon("📁");
  }

  async function deleteCategory(catId: string) {
    if (!confirm("Supprimer cette catégorie et tous ses liens ?")) return;
    if (isSaasMode() && supabase && user) {
      await supabase.from("categories").delete().eq("id", catId).eq("user_id", user.id);
    }
    await persistCategories(categories.filter((c) => c.id !== catId));
  }

  async function addLink(catId: string) {
    const form = newLinks[catId];
    if (!form?.name?.trim() || !form?.url?.trim()) return;

    const url = form.url.trim().startsWith("http")
      ? form.url.trim()
      : `https://${form.url.trim()}`;

    const link: Link = {
      id: generateId(),
      name: form.name.trim(),
      url,
      isPinned: false,
      position: categories.find((c) => c.id === catId)?.links.length ?? 0,
    };

    if (isSaasMode() && supabase && user) {
      await supabase.from("links").insert({ ...link, category_id: catId });
    }

    const updated = categories.map((c) =>
      c.id === catId ? { ...c, links: [...c.links, link] } : c
    );
    await persistCategories(updated);
    setNewLinks((prev) => ({ ...prev, [catId]: { name: "", url: "" } }));
  }

  async function deleteLink(catId: string, linkId: string) {
    if (isSaasMode() && supabase && user) {
      await supabase.from("links").delete().eq("id", linkId);
    }
    const updated = categories.map((c) =>
      c.id === catId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
    );
    await persistCategories(updated);
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Category[];
        if (!Array.isArray(parsed)) throw new Error("Format invalide");
        saveLocalCategories(parsed);
        setCategories(parsed);
        setImportError("");
      } catch {
        setImportError("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Paramètres</h1>
        {isSaasMode() && (
          <button
            onClick={() => signOut()}
            className="text-sm px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Se déconnecter
          </button>
        )}
      </div>

      {/* Import JSON (template mode only) */}
      {!isSaasMode() && (
        <section className="mb-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Importer des liens</h2>
          <p className="text-xs text-gray-500 mb-3">
            Importez un fichier JSON de catégories pour remplacer vos liens actuels.
          </p>
          <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-sm">
            <span>Choisir un fichier JSON</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          </label>
          {importError && <p className="text-xs text-red-400 mt-2">{importError}</p>}
        </section>
      )}

      {/* Add category */}
      <section className="mb-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Nouvelle catégorie</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Icône (emoji)"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-16 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 text-center"
          />
          <input
            type="text"
            placeholder="Nom de la catégorie"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addCategory}
            disabled={!newCatName.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter
          </button>
        </div>
      </section>

      {/* Categories list */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Catégories ({categories.length})
        </h2>
        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const isExpanded = expandedCat === cat.id;
            const linkForm = newLinks[cat.id] || { name: "", url: "" };

            return (
              <div
                key={cat.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden"
              >
                {/* Category header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{cat.name}</span>
                    <span className="text-xs text-gray-500">({cat.links.length})</span>
                    <span className="ml-auto text-gray-500 text-xs">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="ml-3 text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>

                {/* Expanded: links + add form */}
                {isExpanded && (
                  <div className="border-t border-[#2a2a2a] px-4 py-3">
                    {/* Links list */}
                    {cat.links.length > 0 && (
                      <ul className="mb-3 flex flex-col gap-1">
                        {cat.links.map((link) => (
                          <li
                            key={link.id}
                            className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-[#222]"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-gray-200 truncate">{link.name}</span>
                              <span className="text-xs text-gray-500 truncate">{link.url}</span>
                            </div>
                            <button
                              onClick={() => deleteLink(cat.id, link.id)}
                              className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Add link form */}
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="text"
                        placeholder="Nom du lien"
                        value={linkForm.name}
                        onChange={(e) =>
                          setNewLinks((prev) => ({
                            ...prev,
                            [cat.id]: { ...linkForm, name: e.target.value },
                          }))
                        }
                        className="flex-1 min-w-[120px] bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="URL"
                        value={linkForm.url}
                        onChange={(e) =>
                          setNewLinks((prev) => ({
                            ...prev,
                            [cat.id]: { ...linkForm, url: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addLink(cat.id)}
                        className="flex-1 min-w-[160px] bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => addLink(cat.id)}
                        disabled={!linkForm.name?.trim() || !linkForm.url?.trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        + Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {categories.length === 0 && (
            <p className="text-center text-gray-600 py-8 text-sm">
              Aucune catégorie. Créez-en une ci-dessus.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
