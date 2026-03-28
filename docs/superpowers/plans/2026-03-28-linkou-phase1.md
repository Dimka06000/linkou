# Linkou Phase 1 — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a functional link dashboard with auth, tracking, sharing, and GitHub integration — supporting both template and SaaS modes.

**Architecture:** React + Vite app with Supabase backend. Dual-mode via `VITE_MODE` env var: template mode reads from `config/links.json` + localStorage, SaaS mode uses Supabase auth + DB. Feature modules are self-contained and activate based on env vars.

**Tech Stack:** React 18, Vite, TypeScript, Zustand, Supabase (Auth + DB + RLS), Vercel, Tailwind CSS, GitHub API

**Spec:** `docs/superpowers/specs/2026-03-28-linkou-design.md`

---

## File Structure

```
linkou/
├── config/
│   ├── links.json                  # Default links (template mode)
│   └── theme.json                  # Default theme config
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router + layout
│   ├── types/
│   │   └── index.ts                # Shared types (Link, Category, Board, Click)
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client init
│   │   ├── storage.ts              # Abstraction: Supabase or localStorage
│   │   └── github.ts               # GitHub API client
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook (Supabase or noop)
│   │   ├── useLinks.ts             # CRUD links (DB or JSON)
│   │   ├── useCategories.ts        # CRUD categories
│   │   ├── useTracking.ts          # Click logging + stats
│   │   ├── useBoards.ts            # Board CRUD + sharing
│   │   └── useFeature.ts           # Feature flag check (env var presence)
│   ├── components/
│   │   ├── Layout.tsx              # App shell: header, search, main
│   │   ├── SearchBar.tsx           # Fuzzy search with / shortcut
│   │   ├── PinnedSection.tsx       # Starred links at top
│   │   ├── CategorySection.tsx     # Collapsible category with counter
│   │   ├── LinkCard.tsx            # Single link: favicon, name, badge, star
│   │   ├── StatsPanel.tsx          # Usage stats widgets
│   │   ├── BoardCard.tsx           # Board preview card
│   │   └── GitHubWidget.tsx        # Recent repos/commits
│   ├── pages/
│   │   ├── Dashboard.tsx           # Main page
│   │   ├── Stats.tsx               # Analytics page
│   │   ├── Settings.tsx            # User settings + link management
│   │   ├── Auth.tsx                # Login/register (SaaS only)
│   │   ├── Boards.tsx              # My boards list
│   │   └── SharedBoard.tsx         # Public board view (/board/:slug)
│   └── store/
│       └── index.ts                # Zustand: search query, UI state
├── api/
│   └── github.ts                   # Vercel serverless proxy for GitHub
├── supabase/
│   └── migrations/
│       └── 001_initial.sql         # All tables + RLS
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `.env.example`, `.gitignore`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Init Vite + React + TypeScript project**

```bash
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js zustand react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind**

In `tailwind.config.ts`:
```ts
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#161616",
        surface2: "#1e1e1e",
        border: "#2a2a2a",
        accent: "#6366f1",
      },
    },
  },
  plugins: [],
};
```

In `src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Configure Vite**

In `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 5: Create .env.example**

```bash
# Mode: template | saas
VITE_MODE=template

# Supabase (required for saas mode)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Optional features
GITHUB_TOKEN=                   # Server-side only (Vercel env)
VITE_GITHUB_ENABLED=true        # Enables GitHub widget on client
```

- [ ] **Step 6: Create .env.local with VITE_MODE=template**

- [ ] **Step 7: Create minimal App.tsx with dark background**

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <h1 className="text-2xl font-bold p-8">
        Lin<span className="text-indigo-500">kou</span>
      </h1>
    </div>
  );
}
```

- [ ] **Step 8: Run dev server, verify dark page with logo renders**

```bash
npm run dev
```
Expected: Dark page with "Linkou" logo, "kou" in indigo.

- [ ] **Step 9: Create .gitignore**

```
node_modules/
dist/
.env.local
.superpowers/
```

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + Tailwind project"
```

---

## Task 2: Types + Config

**Files:**
- Create: `src/types/index.ts`, `config/links.json`, `config/theme.json`

- [ ] **Step 1: Define core types**

```ts
// src/types/index.ts
export interface Link {
  id: string;
  name: string;
  url: string;
  badge?: "prod" | "test" | "staging";
  thumbnailUrl?: string;
  isPinned: boolean;
  position: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  position: number;
  isCollapsed: boolean;
  links: Link[];
}

export interface Click {
  id: string;
  linkId: string;
  clickedAt: string;
  device: "desktop" | "mobile";
}

export interface Board {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  description: string;
  linkIds: string[];
}

export interface ThemeConfig {
  bgColor: string;
  accentColor: string;
  surfaceColor: string;
}
```

- [ ] **Step 2: Create config/links.json with Dimitri's default links**

Populate with all categories and links from the existing `dashboard.html` (15 categories, 80+ links). Each link gets a generated UUID as `id`. Each category gets a generated UUID as `id`.

```json
{
  "categories": [
    {
      "id": "cat-services",
      "name": "Services perso & Admin",
      "icon": "home",
      "position": 0,
      "links": [
        { "id": "link-ameli", "name": "Ameli", "url": "https://assure.ameli.fr/...", "isPinned": false, "position": 0 },
        ...
      ]
    },
    ...
  ]
}
```

- [ ] **Step 3: Create config/theme.json**

```json
{
  "bgColor": "#0d0d0d",
  "accentColor": "#6366f1",
  "surfaceColor": "#161616"
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types config/
git commit -m "feat: add core types and default config"
```

---

## Task 3: Feature Flags + Storage Abstraction

**Files:**
- Create: `src/hooks/useFeature.ts`, `src/lib/storage.ts`, `src/lib/supabase.ts`

- [ ] **Step 1: Install vitest + testing deps**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.ts`:
```ts
test: {
  environment: "jsdom",
  globals: true,
}
```

- [ ] **Step 2: Write test for useFeature hook**

```ts
// src/hooks/__tests__/useFeature.test.ts
import { isFeatureEnabled } from "../useFeature";

test("returns true when env var is set", () => {
  import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
  expect(isFeatureEnabled("supabase")).toBe(true);
});

test("returns false when env var is empty", () => {
  import.meta.env.VITE_SUPABASE_URL = "";
  expect(isFeatureEnabled("supabase")).toBe(false);
});
```

- [ ] **Step 3: Run test — verify FAIL**

```bash
npx vitest run src/hooks/__tests__/useFeature.test.ts
```

- [ ] **Step 4: Implement useFeature**

GitHub detection uses a `VITE_GITHUB_ENABLED` flag (not the token itself — the token is server-side only, used by the Vercel proxy).

```ts
// src/hooks/useFeature.ts
const FEATURE_MAP = {
  supabase: "VITE_SUPABASE_URL",
  github: "VITE_GITHUB_ENABLED",
} as const;

type Feature = keyof typeof FEATURE_MAP;

export function isFeatureEnabled(feature: Feature): boolean {
  const envVar = FEATURE_MAP[feature];
  const value = import.meta.env[envVar];
  return typeof value === "string" && value.length > 0;
}

export function useFeature(feature: Feature): boolean {
  return isFeatureEnabled(feature);
}

export function isSaasMode(): boolean {
  return import.meta.env.VITE_MODE === "saas";
}
```

- [ ] **Step 5: Run test — verify PASS**

- [ ] **Step 6: Create Supabase client**

```ts
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = url && key ? createClient(url, key) : null;
```

- [ ] **Step 7: Create storage abstraction**

```ts
// src/lib/storage.ts
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
  // Template mode: read from JSON + localStorage overrides
  const stored = localStorage.getItem("linkou-categories");
  const cats: Category[] = stored ? JSON.parse(stored) : defaultLinks.categories as Category[];

  // Restore pinned state from localStorage
  const pinned = JSON.parse(localStorage.getItem("linkou-pinned") || "{}");
  return cats.map((cat) => ({
    ...cat,
    links: cat.links.map((l) => ({ ...l, isPinned: !!pinned[l.id] })),
  }));
}

export async function saveClick(click: Omit<Click, "id">, userId?: string): Promise<void> {
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
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks src/lib
git commit -m "feat: add feature flags, Supabase client, storage abstraction"
```

---

## Task 4: Zustand Store + Search

**Files:**
- Create: `src/store/index.ts`

- [ ] **Step 1: Create store**

```ts
// src/store/index.ts
import { create } from "zustand";

interface AppState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store
git commit -m "feat: add Zustand store with search state"
```

---

## Task 5: Layout + SearchBar

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/SearchBar.tsx`

- [ ] **Step 1: Create SearchBar component**

```tsx
// src/components/SearchBar.tsx
import { useEffect, useRef } from "react";
import { useAppStore } from "../store";

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery } = useAppStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setSearchQuery]);

  return (
    <div className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher un lien ou une plateforme..."
        className="w-full pl-10 pr-4 py-3 bg-[#161616] border border-[#2a2a2a] rounded-xl text-gray-200 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-500"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create Layout component**

```tsx
// src/components/Layout.tsx
import { SearchBar } from "./SearchBar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <header className="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">
              Lin<span className="text-indigo-500">kou</span>
            </div>
          </div>
          <SearchBar />
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx to use Layout**

```tsx
// src/App.tsx
import { Layout } from "./components/Layout";

export default function App() {
  return (
    <Layout>
      <p className="text-gray-500">Dashboard coming soon...</p>
    </Layout>
  );
}
```

- [ ] **Step 4: Run dev, verify header + search renders, / shortcut works**

- [ ] **Step 5: Commit**

```bash
git add src/components src/App.tsx
git commit -m "feat: add Layout shell with sticky header and search bar"
```

---

## Task 6: LinkCard + CategorySection + PinnedSection

**Files:**
- Create: `src/components/LinkCard.tsx`, `src/components/CategorySection.tsx`, `src/components/PinnedSection.tsx`

- [ ] **Step 1: Create LinkCard**

```tsx
// src/components/LinkCard.tsx
import type { Link } from "../types";

interface Props {
  link: Link;
  onTogglePin: (id: string) => void;
  onClick: (link: Link) => void;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return ""; }
}

const BADGE_STYLES = {
  prod: "bg-green-500/15 text-green-400",
  test: "bg-amber-500/15 text-amber-400",
  staging: "bg-blue-500/15 text-blue-400",
} as const;

export function LinkCard({ link, onTogglePin, onClick }: Props) {
  const domain = getDomain(link.url);
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : "";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        onClick(link);
      }}
      className="flex items-center gap-3 px-3.5 py-2.5 bg-[#1e1e1e] rounded-lg border border-transparent hover:border-indigo-500 hover:bg-[#1a1a2e] transition-all group"
    >
      {favicon && (
        <img
          src={favicon}
          alt=""
          className="w-6 h-6 rounded flex-shrink-0"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate flex items-center gap-1.5">
          {link.name}
          {link.badge && (
            <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${BADGE_STYLES[link.badge]}`}>
              {link.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">{domain}</div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTogglePin(link.id);
        }}
        className={`text-lg flex-shrink-0 transition-colors ${link.isPinned ? "text-yellow-400" : "text-[#2a2a2a] hover:text-yellow-400"}`}
      >
        ★
      </button>
    </a>
  );
}
```

- [ ] **Step 2: Create CategorySection**

```tsx
// src/components/CategorySection.tsx
import { useState } from "react";
import type { Category, Link } from "../types";
import { LinkCard } from "./LinkCard";
import { useAppStore } from "../store";

interface Props {
  category: Category;
  onTogglePin: (id: string) => void;
  onLinkClick: (link: Link) => void;
}

export function CategorySection({ category, onTogglePin, onLinkClick }: Props) {
  const [collapsed, setCollapsed] = useState(category.isCollapsed);
  const searchQuery = useAppStore((s) => s.searchQuery);

  const filteredLinks = category.links.filter((link) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return link.name.toLowerCase().includes(q) || link.url.toLowerCase().includes(q);
  });

  if (searchQuery && filteredLinks.length === 0) return null;

  // Auto-expand when searching
  const isCollapsed = searchQuery ? false : collapsed;

  return (
    <div className="mb-5 bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-[#1e1e1e] transition-colors"
      >
        <span className="text-sm font-semibold">{category.icon} {category.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded-full">
            {category.links.length}
          </span>
          <span className={`text-gray-500 text-sm transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>
            ▼
          </span>
        </div>
      </button>
      {!isCollapsed && (
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredLinks.map((link) => (
            <LinkCard key={link.id} link={link} onTogglePin={onTogglePin} onClick={onLinkClick} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create PinnedSection**

```tsx
// src/components/PinnedSection.tsx
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
      <h2 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
        ★ Favoris
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {pinnedLinks.map((link) => (
          <LinkCard key={link.id} link={link} onTogglePin={onTogglePin} onClick={onLinkClick} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run dev, verify components render**

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: add LinkCard, CategorySection, and PinnedSection components"
```

---

## Task 7: Dashboard Page (wire it all together)

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Dashboard page**

```tsx
// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import type { Category, Link } from "../types";
import { loadCategories, saveClick } from "../lib/storage";
import { PinnedSection } from "../components/PinnedSection";
import { CategorySection } from "../components/CategorySection";
import { useAppStore } from "../store";

export function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const searchQuery = useAppStore((s) => s.searchQuery);

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
    // Persist pinned state
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
```

- [ ] **Step 2: Update App.tsx with router**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Run dev, verify full dashboard renders with all links from config/links.json**

- [ ] **Step 4: Test search, pin/unpin, collapse/expand**

- [ ] **Step 5: Commit**

```bash
git add src/pages src/App.tsx
git commit -m "feat: wire up Dashboard page with search, pins, and categories"
```

---

## Task 8: Tracking + Stats Page

**Files:**
- Create: `src/hooks/useTracking.ts`, `src/pages/Stats.tsx`, `src/components/StatsPanel.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create useTracking hook**

```ts
// src/hooks/useTracking.ts
import { useEffect, useState } from "react";
import { loadClicks } from "../lib/storage";
import type { Click } from "../types";

interface Stats {
  totalClicks: number;
  topLinks: { linkId: string; linkName: string; count: number }[];
  recentClicks: Click[];
  weeklyHeatmap: Record<string, number>; // "mon-9" → count
}

export function useTracking(categories: Category[]): Stats {
  const [clicks, setClicks] = useState<Click[]>([]);

  useEffect(() => {
    loadClicks().then(setClicks);
  }, []);

  // Build linkId → name lookup from categories
  const linkNameMap: Record<string, string> = {};
  categories.forEach((cat) => cat.links.forEach((l) => { linkNameMap[l.id] = l.name; }));

  const totalClicks = clicks.length;

  // Top links by click count
  const countMap: Record<string, number> = {};
  clicks.forEach((c) => {
    countMap[c.linkId] = (countMap[c.linkId] || 0) + 1;
  });
  const topLinks = Object.entries(countMap)
    .map(([linkId, count]) => ({ linkId, linkName: linkNameMap[linkId] || linkId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentClicks = clicks.slice(0, 20);

  // Weekly heatmap: day-hour → count
  const weeklyHeatmap: Record<string, number> = {};
  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  clicks.forEach((c) => {
    const d = new Date(c.clickedAt);
    const key = `${days[d.getDay()]}-${d.getHours()}`;
    weeklyHeatmap[key] = (weeklyHeatmap[key] || 0) + 1;
  });

  return { totalClicks, topLinks, recentClicks, weeklyHeatmap };
}
```

- [ ] **Step 2: Create Stats page**

```tsx
// src/pages/Stats.tsx
import { useTracking } from "../hooks/useTracking";

export function Stats() {
  const { totalClicks, topLinks, recentClicks } = useTracking();

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
          <div className="text-3xl font-bold text-indigo-400">
            {topLinks[0]?.count || 0}
          </div>
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
```

- [ ] **Step 3: Add Stats route + nav link in Layout**

Add to `App.tsx` routes:
```tsx
<Route path="/stats" element={<Stats />} />
```

Add nav links in Layout header (Dashboard / Stats).

- [ ] **Step 4: Run dev, click some links, verify stats appear**

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTracking.ts src/pages/Stats.tsx src/App.tsx src/components/Layout.tsx
git commit -m "feat: add click tracking and Stats page with top 10, heatmap"
```

---

## Task 9: Supabase Schema + Auth (SaaS mode)

**Files:**
- Create: `supabase/migrations/001_initial.sql`, `src/hooks/useAuth.ts`, `src/pages/Auth.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create migration SQL**

```sql
-- supabase/migrations/001_initial.sql

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text not null default 'folder',
  position int not null default 0,
  background_video_url text,
  is_collapsed boolean default false,
  created_at timestamptz default now()
);

-- Links
create table links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  url text not null,
  thumbnail_url text,
  badge text check (badge in ('prod', 'test', 'staging')),
  position int not null default 0,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- Clicks
create table clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  link_id uuid references links(id) on delete cascade not null,
  clicked_at timestamptz default now(),
  device text check (device in ('desktop', 'mobile'))
);

-- Boards
create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  is_public boolean default false,
  description text default '',
  created_at timestamptz default now()
);

-- Board links
create table board_links (
  board_id uuid references boards(id) on delete cascade not null,
  link_id uuid references links(id) on delete cascade not null,
  position int not null default 0,
  primary key (board_id, link_id)
);

-- RLS
alter table categories enable row level security;
alter table links enable row level security;
alter table clicks enable row level security;
alter table boards enable row level security;
alter table board_links enable row level security;

-- Users can only see their own data
create policy "Users see own categories" on categories for all using (auth.uid() = user_id);
create policy "Users see own links" on links for all using (auth.uid() = user_id);
create policy "Users see own clicks" on clicks for all using (auth.uid() = user_id);
create policy "Users see own boards" on boards for all using (auth.uid() = user_id);
create policy "Users manage own board_links" on board_links for all using (
  board_id in (select id from boards where user_id = auth.uid())
);

-- Public boards are readable by anyone
create policy "Public boards readable" on boards for select using (is_public = true);
create policy "Public board links readable" on board_links for select using (
  board_id in (select id from boards where is_public = true)
);
create policy "Links in public boards readable" on links for select using (
  id in (select link_id from board_links where board_id in (select id from boards where is_public = true))
);

-- Profiles (extends auth.users with app-specific fields)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  theme_config jsonb default '{}',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users see own profile" on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Indexes
create index idx_links_user on links(user_id);
create index idx_links_category on links(category_id);
create index idx_clicks_user on clicks(user_id);
create index idx_clicks_link on clicks(link_id);
create index idx_clicks_time on clicks(clicked_at);
create index idx_boards_slug on boards(slug);
create index idx_board_links_board on board_links(board_id);
```

- [ ] **Step 2: Create useAuth hook**

```ts
// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isSaasMode } from "./useFeature";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSaasMode() || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) return;
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp(email: string, password: string) {
    if (!supabase) return;
    return supabase.auth.signUp({ email, password });
  }

  async function signOut() {
    if (!supabase) return;
    return supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    return supabase.auth.signInWithOAuth({ provider: "google" });
  }

  return { user, loading, signIn, signUp, signOut, signInWithGoogle };
}
```

- [ ] **Step 3: Create Auth page**

```tsx
// src/pages/Auth.tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, signUp, signInWithGoogle } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fn = isLogin ? signIn : signUp;
    const result = await fn(email, password);
    if (result?.error) setError(result.error.message);
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 text-center">
          {isLogin ? "Connexion" : "Inscription"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-medium transition-colors">
            {isLogin ? "Se connecter" : "Creer un compte"}
          </button>
        </form>
        <button
          onClick={() => signInWithGoogle()}
          className="w-full mt-3 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-indigo-500 text-sm py-3 rounded-lg transition-colors"
        >
          Continuer avec Google
        </button>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Pas de compte ?" : "Deja un compte ?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 ml-1 hover:underline">
            {isLogin ? "Inscription" : "Connexion"}
          </button>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add auth gate in App.tsx for SaaS mode**

If `VITE_MODE=saas` and no user → show Auth page. Otherwise show Dashboard.

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/hooks/useAuth.ts src/pages/Auth.tsx src/App.tsx
git commit -m "feat: add Supabase schema, auth hook, and login/register page"
```

---

## Task 10: Boards / Sharing

**Files:**
- Create: `src/hooks/useBoards.ts`, `src/pages/Boards.tsx`, `src/pages/SharedBoard.tsx`, `src/components/BoardCard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create useBoards hook**

```ts
// src/hooks/useBoards.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { isSaasMode } from "./useFeature";
import type { Board } from "../types";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function useBoards(userId?: string) {
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => { loadBoards(); }, [userId]);

  async function loadBoards() {
    if (isSaasMode() && supabase && userId) {
      const { data } = await supabase.from("boards").select("*, board_links(link_id, position)").eq("user_id", userId).order("created_at");
      setBoards((data || []).map((b: any) => ({ ...b, linkIds: b.board_links.map((bl: any) => bl.link_id) })));
    } else {
      setBoards(JSON.parse(localStorage.getItem("linkou-boards") || "[]"));
    }
  }

  async function createBoard(name: string, description: string) {
    const board: Board = { id: crypto.randomUUID(), name, slug: slugify(name), isPublic: false, description, linkIds: [] };
    if (isSaasMode() && supabase && userId) {
      await supabase.from("boards").insert({ id: board.id, user_id: userId, name, slug: board.slug, description });
    } else {
      const all = [...boards, board];
      localStorage.setItem("linkou-boards", JSON.stringify(all));
    }
    await loadBoards();
  }

  async function toggleBoardPublic(boardId: string) {
    if (isSaasMode() && supabase) {
      const board = boards.find((b) => b.id === boardId);
      if (board) await supabase.from("boards").update({ is_public: !board.isPublic }).eq("id", boardId);
    } else {
      const all = boards.map((b) => b.id === boardId ? { ...b, isPublic: !b.isPublic } : b);
      localStorage.setItem("linkou-boards", JSON.stringify(all));
    }
    await loadBoards();
  }

  async function addLinkToBoard(boardId: string, linkId: string) {
    if (isSaasMode() && supabase) {
      await supabase.from("board_links").insert({ board_id: boardId, link_id: linkId, position: 0 });
    } else {
      const all = boards.map((b) => b.id === boardId ? { ...b, linkIds: [...b.linkIds, linkId] } : b);
      localStorage.setItem("linkou-boards", JSON.stringify(all));
    }
    await loadBoards();
  }

  async function removeLinkFromBoard(boardId: string, linkId: string) {
    if (isSaasMode() && supabase) {
      await supabase.from("board_links").delete().match({ board_id: boardId, link_id: linkId });
    } else {
      const all = boards.map((b) => b.id === boardId ? { ...b, linkIds: b.linkIds.filter((id) => id !== linkId) } : b);
      localStorage.setItem("linkou-boards", JSON.stringify(all));
    }
    await loadBoards();
  }

  return { boards, createBoard, toggleBoardPublic, addLinkToBoard, removeLinkFromBoard };
}

export async function loadPublicBoard(slug: string): Promise<{ board: Board; links: any[] } | null> {
  if (!supabase) return null;
  const { data: board } = await supabase.from("boards").select("*").eq("slug", slug).eq("is_public", true).single();
  if (!board) return null;
  const { data: boardLinks } = await supabase.from("board_links").select("link_id, links(*)").eq("board_id", board.id).order("position");
  const links = (boardLinks || []).map((bl: any) => bl.links);
  return { board, links };
}
```

- [ ] **Step 2: Create Boards page**

```tsx
// src/pages/Boards.tsx
import { useState } from "react";
import { useBoards } from "../hooks/useBoards";
import { useAuth } from "../hooks/useAuth";

export function Boards() {
  const { user } = useAuth();
  const { boards, createBoard, toggleBoardPublic } = useBoards(user?.id);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createBoard(newName, newDesc);
    setNewName("");
    setNewDesc("");
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Mes Boards</h2>
      <form onSubmit={handleCreate} className="flex gap-3 mb-6">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du board" className="flex-1 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500" />
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" className="flex-1 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500" />
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Creer</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => (
          <div key={board.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <h3 className="font-semibold">{board.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{board.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">{board.linkIds.length} liens</span>
              <div className="flex gap-2">
                <button onClick={() => toggleBoardPublic(board.id)} className={`text-xs px-2 py-1 rounded ${board.isPublic ? "bg-green-500/15 text-green-400" : "bg-[#2a2a2a] text-gray-500"}`}>
                  {board.isPublic ? "Public" : "Prive"}
                </button>
                {board.isPublic && (
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/board/${board.slug}`)} className="text-xs px-2 py-1 rounded bg-indigo-500/15 text-indigo-400">
                    Copier le lien
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {boards.length === 0 && <p className="text-gray-500 text-center py-8">Aucun board. Cree-en un pour partager tes liens !</p>}
    </div>
  );
}
```

- [ ] **Step 3: Create SharedBoard page**

```tsx
// src/pages/SharedBoard.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadPublicBoard } from "../hooks/useBoards";
import { LinkCard } from "../components/LinkCard";

export function SharedBoard() {
  const { slug } = useParams<{ slug: string }>();
  const [board, setBoard] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    loadPublicBoard(slug).then((result) => {
      if (result) { setBoard(result.board); setLinks(result.links); }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <p className="text-gray-500 text-center py-12">Chargement...</p>;
  if (!board) return <p className="text-gray-500 text-center py-12">Board introuvable ou prive.</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">{board.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{board.description}</p>
        <p className="text-xs text-gray-600 mt-2">Partage via Linkou</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {links.map((link: any) => (
          <LinkCard key={link.id} link={link} onTogglePin={() => {}} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add routes**

```tsx
<Route path="/boards" element={<Boards />} />
<Route path="/board/:slug" element={<SharedBoard />} />
```

- [ ] **Step 5: Add nav link for Boards in Layout**

- [ ] **Step 6: Run dev, test board creation, sharing link**

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useBoards.ts src/pages/Boards.tsx src/pages/SharedBoard.tsx src/components/BoardCard.tsx src/App.tsx src/components/Layout.tsx
git commit -m "feat: add boards with sharing via public slug"
```

---

## Task 11: GitHub Integration

**Files:**
- Create: `src/lib/github.ts`, `src/components/GitHubWidget.tsx`, `api/github.ts`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create GitHub API client**

```ts
// src/lib/github.ts
interface Repo {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export async function fetchRecentRepos(): Promise<Repo[]> {
  const res = await fetch("/api/github?type=repos");
  if (!res.ok) return [];
  return res.json();
}
```

- [ ] **Step 2: Create Vercel serverless proxy**

```ts
// api/github.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(404).json({ error: "GitHub not configured" });

  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=5", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  const data = await response.json();

  const repos = data.map((r: any) => ({
    name: r.name,
    url: r.html_url,
    description: r.description || "",
    language: r.language || "",
    stars: r.stargazers_count,
    updatedAt: r.updated_at,
    isPrivate: r.private,
  }));

  res.json(repos);
}
```

- [ ] **Step 3: Create GitHubWidget component**

Shows latest 5 repos as cards with language badge, last updated.

- [ ] **Step 4: Add GitHubWidget to Dashboard (conditionally via useFeature("github"))**

- [ ] **Step 5: Run dev, verify repos appear (or graceful fallback)**

- [ ] **Step 6: Commit**

```bash
git add src/lib/github.ts src/components/GitHubWidget.tsx api/github.ts src/pages/Dashboard.tsx
git commit -m "feat: add GitHub widget with recent repos"
```

---

## Task 12: Settings Page + Link Management (SaaS)

**Files:**
- Create: `src/pages/Settings.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Settings page with link management**

```tsx
// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import type { Category, Link } from "../types";
import { loadCategories } from "../lib/storage";
import { useAuth } from "../hooks/useAuth";
import { isSaasMode } from "../hooks/useFeature";
import { supabase } from "../lib/supabase";

export function Settings() {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [addingLinkToCat, setAddingLinkToCat] = useState<string | null>(null);

  useEffect(() => { loadCategories(user?.id).then(setCategories); }, [user]);

  async function addCategory() {
    if (!newCatName.trim()) return;
    const cat: Category = { id: crypto.randomUUID(), name: newCatName, icon: "folder", position: categories.length, isCollapsed: false, links: [] };
    if (isSaasMode() && supabase && user) {
      await supabase.from("categories").insert({ id: cat.id, user_id: user.id, name: cat.name, icon: cat.icon, position: cat.position });
    }
    const updated = [...categories, cat];
    setCategories(updated);
    if (!isSaasMode()) localStorage.setItem("linkou-categories", JSON.stringify(updated));
    setNewCatName("");
  }

  async function deleteCategory(catId: string) {
    if (isSaasMode() && supabase) {
      await supabase.from("categories").delete().eq("id", catId);
    }
    const updated = categories.filter((c) => c.id !== catId);
    setCategories(updated);
    if (!isSaasMode()) localStorage.setItem("linkou-categories", JSON.stringify(updated));
  }

  async function addLink(catId: string) {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    const link: Link = { id: crypto.randomUUID(), name: newLinkName, url: newLinkUrl, isPinned: false, position: 0 };
    if (isSaasMode() && supabase && user) {
      await supabase.from("links").insert({ id: link.id, user_id: user.id, category_id: catId, name: link.name, url: link.url, position: link.position });
    }
    const updated = categories.map((c) => c.id === catId ? { ...c, links: [...c.links, link] } : c);
    setCategories(updated);
    if (!isSaasMode()) localStorage.setItem("linkou-categories", JSON.stringify(updated));
    setNewLinkName("");
    setNewLinkUrl("");
    setAddingLinkToCat(null);
  }

  async function deleteLink(catId: string, linkId: string) {
    if (isSaasMode() && supabase) {
      await supabase.from("links").delete().eq("id", linkId);
    }
    const updated = categories.map((c) => c.id === catId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c);
    setCategories(updated);
    if (!isSaasMode()) localStorage.setItem("linkou-categories", JSON.stringify(updated));
  }

  async function importFromJson() {
    const res = await fetch("/config/links.json");
    const data = await res.json();
    if (isSaasMode() && supabase && user) {
      for (const cat of data.categories) {
        await supabase.from("categories").upsert({ id: cat.id, user_id: user.id, name: cat.name, icon: cat.icon, position: cat.position });
        for (const link of cat.links) {
          await supabase.from("links").upsert({ id: link.id, user_id: user.id, category_id: cat.id, name: link.name, url: link.url, position: link.position });
        }
      }
    }
    setCategories(data.categories);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Parametres</h2>
        {user && <button onClick={() => signOut()} className="text-sm text-red-400 hover:underline">Deconnexion</button>}
      </div>

      <div className="mb-6 flex gap-3">
        <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nouvelle categorie" className="flex-1 px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500" />
        <button onClick={addCategory} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Ajouter</button>
        {isSaasMode() && (
          <button onClick={importFromJson} className="bg-[#2a2a2a] hover:bg-[#333] text-sm px-4 py-2 rounded-lg">Importer JSON</button>
        )}
      </div>

      {categories.map((cat) => (
        <div key={cat.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{cat.icon} {cat.name}</h3>
            <div className="flex gap-2">
              <button onClick={() => setAddingLinkToCat(addingLinkToCat === cat.id ? null : cat.id)} className="text-xs text-indigo-400 hover:underline">+ Lien</button>
              <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-400 hover:underline">Supprimer</button>
            </div>
          </div>
          {addingLinkToCat === cat.id && (
            <div className="flex gap-2 mb-3">
              <input value={newLinkName} onChange={(e) => setNewLinkName(e.target.value)} placeholder="Nom" className="flex-1 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs outline-none focus:border-indigo-500" />
              <input value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} placeholder="URL" className="flex-1 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs outline-none focus:border-indigo-500" />
              <button onClick={() => addLink(cat.id)} className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs">OK</button>
            </div>
          )}
          <div className="space-y-1">
            {cat.links.map((link) => (
              <div key={link.id} className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] rounded-lg">
                <div>
                  <span className="text-sm">{link.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{link.url.substring(0, 40)}...</span>
                </div>
                <button onClick={() => deleteLink(cat.id, link.id)} className="text-xs text-red-400 hover:underline">×</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add route + nav link**

Add to `App.tsx`:
```tsx
<Route path="/settings" element={<Settings />} />
```

Add "Parametres" nav link in Layout header.

- [ ] **Step 3: Run dev, test adding/deleting categories and links**

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.tsx src/App.tsx src/components/Layout.tsx
git commit -m "feat: add Settings page with link management"
```

---

## Task 13: Deploy to Vercel

**Files:**
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Create Vercel project**

```bash
npx vercel
```

- [ ] **Step 2: Set env vars on Vercel**

```bash
npx vercel env add VITE_MODE
npx vercel env add VITE_SUPABASE_URL
npx vercel env add VITE_SUPABASE_ANON_KEY
npx vercel env add GITHUB_TOKEN
```

- [ ] **Step 3: Deploy**

```bash
npx vercel --prod
```

- [ ] **Step 4: Verify prod deployment works**

- [ ] **Step 5: Commit any config changes**

```bash
git add vercel.json
git commit -m "chore: add Vercel deployment config"
```

---

## Task 14: Final Polish + README

- [ ] **Step 1: Add .gitignore entries**

```
.superpowers/
.env.local
node_modules/
dist/
```

- [ ] **Step 2: Write README.md**

Quick start guide:
1. Fork the repo
2. Copy `.env.example` → `.env.local`
3. Edit `config/links.json`
4. `npm install && npm run dev`
5. Deploy to Vercel

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "docs: add README with quick start guide"
```
