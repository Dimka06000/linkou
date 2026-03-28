import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { isSaasMode } from "./useFeature";
import type { Board, Link } from "../types";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function makeUniqueSlug(base: string): string {
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

function getLocalBoards(): Board[] {
  return JSON.parse(localStorage.getItem("linkou-boards") || "[]");
}

function saveLocalBoards(boards: Board[]): void {
  localStorage.setItem("linkou-boards", JSON.stringify(boards));
}

export function useBoards(userId?: string) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBoards = useCallback(async () => {
    setLoading(true);
    if (isSaasMode() && supabase && userId) {
      const { data } = await supabase
        .from("boards")
        .select("*, board_links(link_id, position)")
        .eq("user_id", userId)
        .order("created_at");
      const mapped: Board[] = (data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        isPublic: b.is_public,
        description: b.description || "",
        linkIds: (b.board_links || [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((bl: any) => bl.link_id),
      }));
      setBoards(mapped);
    } else {
      setBoards(getLocalBoards());
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  async function createBoard(name: string, description = ""): Promise<Board | null> {
    const slug = makeUniqueSlug(slugify(name) || "board");
    if (isSaasMode() && supabase && userId) {
      const { data, error } = await supabase
        .from("boards")
        .insert({ user_id: userId, name, slug, description, is_public: false })
        .select()
        .single();
      if (error || !data) return null;
      const board: Board = { id: data.id, name: data.name, slug: data.slug, isPublic: data.is_public, description: data.description || "", linkIds: [] };
      setBoards((prev) => [...prev, board]);
      return board;
    } else {
      const board: Board = { id: crypto.randomUUID(), name, slug, isPublic: false, description, linkIds: [] };
      const updated = [...getLocalBoards(), board];
      saveLocalBoards(updated);
      setBoards(updated);
      return board;
    }
  }

  async function toggleBoardPublic(boardId: string): Promise<void> {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    const next = !board.isPublic;
    if (isSaasMode() && supabase && userId) {
      await supabase.from("boards").update({ is_public: next }).eq("id", boardId);
    } else {
      const updated = boards.map((b) => b.id === boardId ? { ...b, isPublic: next } : b);
      saveLocalBoards(updated);
    }
    setBoards((prev) => prev.map((b) => b.id === boardId ? { ...b, isPublic: next } : b));
  }

  async function addLinkToBoard(boardId: string, linkId: string): Promise<void> {
    const board = boards.find((b) => b.id === boardId);
    if (!board || board.linkIds.includes(linkId)) return;
    const position = board.linkIds.length;
    if (isSaasMode() && supabase && userId) {
      await supabase.from("board_links").insert({ board_id: boardId, link_id: linkId, position });
    } else {
      const updated = boards.map((b) => b.id === boardId ? { ...b, linkIds: [...b.linkIds, linkId] } : b);
      saveLocalBoards(updated);
    }
    setBoards((prev) => prev.map((b) => b.id === boardId ? { ...b, linkIds: [...b.linkIds, linkId] } : b));
  }

  async function removeLinkFromBoard(boardId: string, linkId: string): Promise<void> {
    if (isSaasMode() && supabase && userId) {
      await supabase.from("board_links").delete().eq("board_id", boardId).eq("link_id", linkId);
    } else {
      const updated = boards.map((b) => b.id === boardId ? { ...b, linkIds: b.linkIds.filter((id) => id !== linkId) } : b);
      saveLocalBoards(updated);
    }
    setBoards((prev) => prev.map((b) => b.id === boardId ? { ...b, linkIds: b.linkIds.filter((id) => id !== linkId) } : b));
  }

  async function deleteBoard(boardId: string): Promise<void> {
    if (isSaasMode() && supabase && userId) {
      await supabase.from("boards").delete().eq("id", boardId);
    } else {
      const updated = boards.filter((b) => b.id !== boardId);
      saveLocalBoards(updated);
    }
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
  }

  return { boards, loading, createBoard, toggleBoardPublic, addLinkToBoard, removeLinkFromBoard, deleteBoard, reload: loadBoards };
}

export async function loadPublicBoard(slug: string): Promise<{ board: Board; links: Link[] } | null> {
  if (supabase) {
    const { data: boardData } = await supabase
      .from("boards")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .single();
    if (!boardData) return null;

    const { data: blData } = await supabase
      .from("board_links")
      .select("link_id, position")
      .eq("board_id", boardData.id)
      .order("position");

    const linkIds = (blData || []).map((bl: any) => bl.link_id);
    let links: Link[] = [];
    if (linkIds.length > 0) {
      const { data: linksData } = await supabase
        .from("links")
        .select("*")
        .in("id", linkIds);
      links = (linksData || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        url: l.url,
        badge: l.badge,
        thumbnailUrl: l.thumbnail_url,
        isPinned: l.is_pinned,
        position: l.position,
      }));
    }

    const board: Board = {
      id: boardData.id,
      name: boardData.name,
      slug: boardData.slug,
      isPublic: boardData.is_public,
      description: boardData.description || "",
      linkIds,
    };
    return { board, links };
  }

  // Template mode: load from localStorage
  const boards = JSON.parse(localStorage.getItem("linkou-boards") || "[]") as Board[];
  const board = boards.find((b) => b.slug === slug && b.isPublic);
  if (!board) return null;

  const cats = JSON.parse(localStorage.getItem("linkou-categories") || "[]");
  const allLinks: Link[] = cats.flatMap((c: any) => c.links || []);
  const links = board.linkIds
    .map((id) => allLinks.find((l) => l.id === id))
    .filter(Boolean) as Link[];
  return { board, links };
}
