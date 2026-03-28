import { supabase } from "./supabase";
import { isSaasMode } from "../hooks/useFeature";
import type { Category, Click } from "../types";
import defaultLinks from "../../config/links.json";

export async function loadCategories(userId?: string): Promise<Category[]> {
  if (isSaasMode() && supabase && userId) {
    const { data } = await supabase
      .from("categories")
      .select("*, links(*)")
      .eq("user_id", userId)
      .order("position");
    return data || [];
  }
  const stored = localStorage.getItem("linkou-categories");
  const cats: Category[] = stored
    ? JSON.parse(stored)
    : (defaultLinks as unknown as Category[]);

  // Restore pinned state from localStorage
  const pinned = JSON.parse(localStorage.getItem("linkou-pinned") || "{}");
  return cats.map((cat) => ({
    ...cat,
    links: cat.links.map((l) => ({ ...l, isPinned: !!pinned[l.id] })),
  }));
}

export async function saveClick(
  click: Omit<Click, "id">,
  userId?: string
): Promise<void> {
  if (isSaasMode() && supabase && userId) {
    await supabase.from("clicks").insert({ ...click, user_id: userId });
    return;
  }
  const clicks = JSON.parse(localStorage.getItem("linkou-clicks") || "[]");
  clicks.push({ ...click, id: crypto.randomUUID() });
  localStorage.setItem("linkou-clicks", JSON.stringify(clicks));
}

export async function loadClicks(userId?: string): Promise<Click[]> {
  if (isSaasMode() && supabase && userId) {
    const { data } = await supabase
      .from("clicks")
      .select("*")
      .eq("user_id", userId)
      .order("clicked_at", { ascending: false });
    return data || [];
  }
  return JSON.parse(localStorage.getItem("linkou-clicks") || "[]");
}
