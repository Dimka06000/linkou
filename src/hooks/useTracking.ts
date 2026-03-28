import { useEffect, useState } from "react";
import { loadClicks } from "../lib/storage";
import type { Click, Category } from "../types";

interface Stats {
  totalClicks: number;
  topLinks: { linkId: string; linkName: string; count: number }[];
  recentClicks: Click[];
  weeklyHeatmap: Record<string, number>;
}

export function useTracking(categories: Category[]): Stats {
  const [clicks, setClicks] = useState<Click[]>([]);

  useEffect(() => {
    loadClicks().then(setClicks);
  }, []);

  const linkNameMap: Record<string, string> = {};
  categories.forEach((cat) => cat.links.forEach((l) => { linkNameMap[l.id] = l.name; }));

  const totalClicks = clicks.length;

  const countMap: Record<string, number> = {};
  clicks.forEach((c) => {
    countMap[c.linkId] = (countMap[c.linkId] || 0) + 1;
  });
  const topLinks = Object.entries(countMap)
    .map(([linkId, count]) => ({ linkId, linkName: linkNameMap[linkId] || linkId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentClicks = clicks.slice(0, 20);

  const weeklyHeatmap: Record<string, number> = {};
  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  clicks.forEach((c) => {
    const d = new Date(c.clickedAt);
    const key = `${days[d.getDay()]}-${d.getHours()}`;
    weeklyHeatmap[key] = (weeklyHeatmap[key] || 0) + 1;
  });

  return { totalClicks, topLinks, recentClicks, weeklyHeatmap };
}
