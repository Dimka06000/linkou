import { useEffect, useState } from "react";
import { useTracking } from "../hooks/useTracking";
import { loadCategories } from "../lib/storage";
import type { Category } from "../types";

export function Stats() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { loadCategories().then(setCategories); }, []);
  const { totalClicks, topLinks } = useTracking(categories);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Statistiques d'usage</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <div className="text-3xl font-bold text-indigo-400">{totalClicks}</div>
          <div className="text-sm text-gray-500 mt-1">Clics totaux</div>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <div className="text-3xl font-bold text-indigo-400">{topLinks.length}</div>
          <div className="text-sm text-gray-500 mt-1">Liens utilises</div>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <div className="text-3xl font-bold text-indigo-400">{topLinks[0]?.count || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Max clics (top lien)</div>
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-3">Top 10</h3>
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {topLinks.map((t, i) => (
          <div key={t.linkId} className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] last:border-0">
            <span className="text-sm">
              <span className="text-gray-500 mr-3">#{i + 1}</span>
              {t.linkName}
            </span>
            <span className="text-sm text-indigo-400 font-medium">{t.count} clics</span>
          </div>
        ))}
        {topLinks.length === 0 && (
          <p className="text-gray-500 text-sm p-4 text-center">Pas encore de donnees. Commence a cliquer !</p>
        )}
      </div>
    </div>
  );
}
