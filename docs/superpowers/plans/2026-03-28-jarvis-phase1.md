# Jarvis Linkou Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the link dashboard into a Jarvis-like personal cockpit with sidebar navigation, command palette, planning module (Google Calendar + Outlook), projects dashboard (GitHub + Vercel + Railway), and a text briefing.

**Architecture:** Refactor the existing React + Vite app from top-nav layout to sidebar-based Notion-style layout. Add serverless proxies for external APIs. Calendar OAuth tokens stored encrypted in Supabase. Existing link/tracking/board features preserved and reorganized into sidebar sub-pages.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, Supabase, Vercel Serverless, Google Calendar API, Microsoft Graph API, GitHub API, Vercel API, Railway API

**Spec:** `docs/superpowers/specs/2026-03-28-jarvis-linkou-design.md`

---

## File Structure

```
src/
├── App.tsx                          # Router with sidebar layout
├── main.tsx                         # Entry point (unchanged)
├── types/
│   └── index.ts                     # Add Calendar, Project, Briefing types
├── store/
│   └── index.ts                     # Add sidebar state, mobile menu
├── components/
│   ├── Sidebar.tsx                  # NEW — sidebar navigation
│   ├── TopBar.tsx                   # NEW — search + time + avatar
│   ├── AppShell.tsx                 # NEW — sidebar + topbar + main wrapper
│   ├── CommandPalette.tsx           # NEW — Cmd+K modal search
│   ├── BriefingCard.tsx             # NEW — Jarvis morning briefing
│   ├── CategorySection.tsx          # Unchanged
│   ├── LinkCard.tsx                 # Unchanged
│   ├── PinnedSection.tsx            # Unchanged
│   ├── SearchBar.tsx                # REMOVE (replaced by TopBar search)
│   ├── Layout.tsx                   # REMOVE (replaced by AppShell)
│   └── GitHubWidget.tsx             # REMOVE (replaced by Projects module)
├── hooks/
│   ├── useAuth.ts                   # Unchanged
│   ├── useBoards.ts                 # Unchanged
│   ├── useFeature.ts                # Unchanged
│   ├── useTracking.ts              # Unchanged
│   ├── useCalendar.ts              # NEW — fetch calendar events
│   ├── useProjects.ts              # NEW — fetch GitHub + Vercel + Railway
│   └── useBriefing.ts              # NEW — generate briefing text
├── lib/
│   ├── supabase.ts                  # Unchanged
│   ├── storage.ts                   # Unchanged
│   ├── github.ts                    # Modify — add commits endpoint
│   ├── calendar.ts                  # NEW — Google + Outlook API client
│   ├── vercel-api.ts               # NEW — Vercel deployments client
│   ├── railway-api.ts              # NEW — Railway services client
│   └── crypto.ts                    # NEW — token encryption (same as Elaubody)
├── pages/
│   ├── Dashboard.tsx                # REWRITE — briefing + cards grid
│   ├── Planning.tsx                 # NEW — calendar views (day/week/month)
│   ├── Projets.tsx                  # NEW — dev projects overview
│   ├── LinksCategory.tsx            # NEW — single category page (from sidebar)
│   ├── Stats.tsx                    # Minor update (accessible from sidebar)
│   ├── Boards.tsx                   # Unchanged
│   ├── Settings.tsx                 # Add integrations section
│   ├── Integrations.tsx             # NEW — OAuth flows + API keys
│   ├── Auth.tsx                     # Unchanged
│   └── SharedBoard.tsx              # Unchanged
api/
├── github.ts                        # Modify — add commits endpoint
├── calendar.ts                      # NEW — merge Google + Outlook events
├── vercel.ts                        # NEW — deployments proxy
├── railway.ts                       # NEW — services proxy
├── briefing.ts                      # NEW — aggregate briefing text
├── auth/
│   ├── google.ts                    # NEW — Google OAuth flow
│   └── outlook.ts                   # NEW — Microsoft OAuth flow
supabase/
└── migrations/
    └── 002_jarvis.sql               # NEW — integration_tokens, user_preferences
```

---

## Task 1: Database Migration — integration_tokens + user_preferences

**Files:**
- Create: `supabase/migrations/002_jarvis.sql`

- [ ] **Step 1: Create migration SQL**

```sql
-- supabase/migrations/002_jarvis.sql

-- Integration tokens (OAuth + API keys, encrypted)
create table integration_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, provider)
);

alter table integration_tokens enable row level security;
create policy "Users see own tokens" on integration_tokens for all using (auth.uid() = user_id);

-- User preferences
create table user_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  sidebar_order jsonb default '[]',
  dashboard_layout jsonb default '[]',
  voice_id text default 'default',
  theme text default 'dark',
  default_calendar_view text default 'day',
  created_at timestamptz default now()
);

alter table user_preferences enable row level security;
create policy "Users see own prefs" on user_preferences for all using (auth.uid() = id);

-- Auto-create preferences on signup
create or replace function handle_new_user_prefs()
returns trigger as $$
begin
  insert into user_preferences (id) values (new.id);
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_prefs
  after insert on auth.users
  for each row execute function handle_new_user_prefs();
```

- [ ] **Step 2: Push migration**

```bash
npx supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_jarvis.sql
git commit -m "feat: add integration_tokens and user_preferences tables"
```

---

## Task 2: Types Update

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add new types**

Add to `src/types/index.ts`:

```ts
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  location?: string;
  source: "google" | "outlook";
  tag?: string;
  travelTime?: number; // minutes
  travelMode?: string;
}

export interface Project {
  name: string;
  repoUrl: string;
  prodUrl: string;
  platform: "vercel" | "railway";
  lastCommit: {
    message: string;
    date: string;
    author: string;
  };
  deployStatus: "ready" | "building" | "error" | "unknown";
  deployDate: string;
}

export interface Briefing {
  greeting: string;
  summary: string;
  events: number;
  trades?: { pnl: number; open: number };
  health?: { score: number };
  expenses?: { total: number; budget: number };
  nextEvent?: { title: string; travelMinutes: number; departIn: number };
}

export interface Integration {
  provider: string;
  connected: boolean;
  expiresAt?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Calendar, Project, Briefing, Integration types"
```

---

## Task 3: Zustand Store Update

**Files:**
- Modify: `src/store/index.ts`

- [ ] **Step 1: Update store with sidebar state**

```ts
// src/store/index.ts
import { create } from "zustand";

interface AppState {
  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/index.ts
git commit -m "feat: add sidebar and command palette state to store"
```

---

## Task 4: Sidebar Component

**Files:**
- Create: `src/components/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar**

```tsx
// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store";
import type { Category } from "../types";
import { useEffect, useState } from "react";
import { loadCategories } from "../lib/storage";

const MAIN_LINKS = [
  { to: "/", icon: "🏠", label: "Dashboard", end: true },
  { to: "/planning", icon: "📅", label: "Planning" },
  { to: "/projets", icon: "💻", label: "Projets" },
];

const AUTH_LINKS = [
  { to: "/stats", icon: "📊", label: "Stats" },
  { to: "/boards", icon: "📋", label: "Boards" },
];

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories(user?.id).then(setCategories);
  }, [user]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-indigo-500/12 text-indigo-400"
        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#111] border-r border-[#1e1e1e] flex flex-col z-50 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-[#1e1e1e]">
          <div className="text-xl font-bold tracking-tight">
            Lin<span className="text-indigo-500">kou</span>
          </div>
          {user && (
            <div className="text-xs text-gray-500 mt-1">{user.email}</div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* Main */}
          <div className="mb-4">
            <div className="px-3 mb-1 text-[0.65rem] text-gray-600 uppercase tracking-wider">
              Principal
            </div>
            {MAIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={navClass}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <span className="w-5 text-center">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
            {user &&
              AUTH_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={navClass}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                >
                  <span className="w-5 text-center">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
          </div>

          {/* Link categories */}
          <div>
            <div className="px-3 mb-1 text-[0.65rem] text-gray-600 uppercase tracking-wider">
              Liens rapides
            </div>
            {categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/links/${cat.id}`}
                className={navClass}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <span className="w-5 text-center">{cat.icon}</span>
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto text-[0.65rem] text-gray-600">
                  {cat.links.length}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-[#1e1e1e] space-y-1">
          <NavLink to="/settings" className={navClass}>
            <span className="w-5 text-center">⚙️</span> Parametres
          </NavLink>
          <NavLink to="/integrations" className={navClass}>
            <span className="w-5 text-center">🔗</span> Integrations
          </NavLink>
          {!user && (
            <NavLink to="/login" className={navClass}>
              <span className="w-5 text-center">👤</span> Connexion
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with nav, categories, mobile support"
```

---

## Task 5: TopBar + CommandPalette

**Files:**
- Create: `src/components/TopBar.tsx`, `src/components/CommandPalette.tsx`

- [ ] **Step 1: Create TopBar**

```tsx
// src/components/TopBar.tsx
import { useAppStore } from "../store";
import { useAuth } from "../hooks/useAuth";

export function TopBar() {
  const { setSidebarOpen, setCommandPaletteOpen } = useAppStore();
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e1e] sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-xl z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          ☰
        </button>
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-gray-500 hover:border-[#3a3a3a] transition-colors w-[300px] md:w-[400px] text-left"
        >
          ⌘K Rechercher partout...
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">
          {dateStr} · {timeStr}
        </span>
        {user && (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold">
            {user.email?.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CommandPalette**

```tsx
// src/components/CommandPalette.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { loadCategories } from "../lib/storage";
import type { Category } from "../types";

interface SearchResult {
  type: "link" | "page" | "category";
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelected(0);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([
        { type: "page", icon: "🏠", title: "Dashboard", subtitle: "Page", action: () => navigate("/") },
        { type: "page", icon: "📅", title: "Planning", subtitle: "Page", action: () => navigate("/planning") },
        { type: "page", icon: "💻", title: "Projets", subtitle: "Page", action: () => navigate("/projets") },
        { type: "page", icon: "📊", title: "Stats", subtitle: "Page", action: () => navigate("/stats") },
      ]);
      return;
    }

    const q = query.toLowerCase();
    loadCategories(user?.id).then((cats) => {
      const linkResults: SearchResult[] = [];
      cats.forEach((cat) => {
        cat.links.forEach((link) => {
          if (link.name.toLowerCase().includes(q) || link.url.toLowerCase().includes(q)) {
            linkResults.push({
              type: "link",
              icon: "🔗",
              title: link.name,
              subtitle: new URL(link.url).hostname,
              action: () => window.open(link.url, "_blank"),
            });
          }
        });
      });
      setResults(linkResults.slice(0, 10));
      setSelected(0);
    });
  }, [query, navigate]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      results[selected].action();
      setCommandPaletteOpen(false);
    }
  }

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-lg bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un lien, une page, un rdv..."
          className="w-full px-5 py-4 bg-transparent text-gray-200 text-sm outline-none border-b border-[#2a2a2a] placeholder:text-gray-500"
        />
        <div className="max-h-[300px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                r.action();
                setCommandPaletteOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition-colors ${
                i === selected ? "bg-indigo-500/10 text-indigo-400" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <span>{r.icon}</span>
              <span className="flex-1">{r.title}</span>
              <span className="text-xs text-gray-600">{r.subtitle}</span>
            </button>
          ))}
          {results.length === 0 && query && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              Aucun resultat pour "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar.tsx src/components/CommandPalette.tsx
git commit -m "feat: add TopBar and CommandPalette (Cmd+K) components"
```

---

## Task 6: AppShell + Router Rewrite

**Files:**
- Create: `src/components/AppShell.tsx`
- Rewrite: `src/App.tsx`
- Delete: `src/components/Layout.tsx`, `src/components/SearchBar.tsx`

- [ ] **Step 1: Create AppShell**

```tsx
// src/components/AppShell.tsx
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <Sidebar />
      <CommandPalette />
      <div className="lg:ml-[260px]">
        <TopBar />
        <main className="p-6 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite App.tsx**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Planning } from "./pages/Planning";
import { Projets } from "./pages/Projets";
import { LinksCategory } from "./pages/LinksCategory";
import { Stats } from "./pages/Stats";
import { Boards } from "./pages/Boards";
import { Settings } from "./pages/Settings";
import { Integrations } from "./pages/Integrations";
import { Auth } from "./pages/Auth";
import { SharedBoard } from "./pages/SharedBoard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board/:slug" element={<SharedBoard />} />
        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/planning" element={<Planning />} />
                <Route path="/projets" element={<Projets />} />
                <Route path="/links/:categoryId" element={<LinksCategory />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/boards" element={<Boards />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/login" element={<Auth />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Delete old Layout.tsx and SearchBar.tsx**

```bash
rm src/components/Layout.tsx src/components/SearchBar.tsx
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AppShell.tsx src/App.tsx
git add -u  # stages deletions
git commit -m "feat: replace top-nav with sidebar-based AppShell layout"
```

---

## Task 7: Dashboard Rewrite with Briefing

**Files:**
- Create: `src/components/BriefingCard.tsx`
- Rewrite: `src/pages/Dashboard.tsx`
- Delete: `src/components/GitHubWidget.tsx`

- [ ] **Step 1: Create BriefingCard**

```tsx
// src/components/BriefingCard.tsx
import type { Briefing } from "../types";

interface Props {
  briefing: Briefing | null;
}

export function BriefingCard({ briefing }: Props) {
  if (!briefing) {
    return (
      <div className="col-span-full bg-gradient-to-br from-[#161616] to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-5 bg-white/5 rounded w-48 mb-3" />
        <div className="h-4 bg-white/5 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="col-span-full bg-gradient-to-br from-[#161616] to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 flex items-center gap-5">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
        🤖
      </div>
      <div className="flex-1">
        <div className="text-lg font-semibold">{briefing.greeting}</div>
        <div className="text-sm text-gray-400 mt-1 leading-relaxed">
          {briefing.summary}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite Dashboard.tsx**

```tsx
// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import type { Category, Link } from "../types";
import { loadCategories, saveClick } from "../lib/storage";
import { BriefingCard } from "../components/BriefingCard";
import { PinnedSection } from "../components/PinnedSection";

export function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories().then(setCategories);
  }, []);

  const pinnedLinks = categories.flatMap((c) => c.links.filter((l) => l.isPinned));

  // Top 8 most used (from click tracking)
  const [topLinks, setTopLinks] = useState<Link[]>([]);
  useEffect(() => {
    const clicks = JSON.parse(localStorage.getItem("linkou-clicks") || "[]");
    const countMap: Record<string, number> = {};
    clicks.forEach((c: any) => { countMap[c.linkId] = (countMap[c.linkId] || 0) + 1; });

    const allLinks = categories.flatMap((c) => c.links);
    const sorted = allLinks
      .map((l) => ({ ...l, count: countMap[l.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    setTopLinks(sorted);
  }, [categories]);

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

  // Simple briefing
  const briefing = {
    greeting: `Bonjour${new Date().getHours() < 12 ? "" : new Date().getHours() < 18 ? ", bon apres-midi" : " bonsoir"}`,
    summary: `Tu as ${pinnedLinks.length} favoris et ${categories.reduce((s, c) => s + c.links.length, 0)} liens organises en ${categories.length} categories.`,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <BriefingCard briefing={{ ...briefing, events: 0 }} />

      {/* Top links */}
      {topLinks.length > 0 && (
        <div className="col-span-full md:col-span-2 bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Les plus utilises</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topLinks.map((link) => {
              const domain = (() => { try { return new URL(link.url).hostname; } catch { return ""; } })();
              const favicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : "";
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(link)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#1e1e2e] border border-transparent hover:border-indigo-500/30 transition-all"
                >
                  {favicon && <img src={favicon} alt="" className="w-6 h-6 rounded" loading="lazy" />}
                  <span className="text-xs text-center truncate w-full">{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Pinned */}
      {pinnedLinks.length > 0 && (
        <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3 text-yellow-400">★ Favoris</h3>
          <div className="space-y-1">
            {pinnedLinks.slice(0, 6).map((link) => {
              const domain = (() => { try { return new URL(link.url).hostname; } catch { return ""; } })();
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(link)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt="" className="w-4 h-4" loading="lazy"
                  />
                  <span className="text-sm truncate">{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Planning placeholder */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">📅 Aujourd'hui</h3>
          <a href="/planning" className="text-xs text-indigo-400">Voir planning →</a>
        </div>
        <p className="text-sm text-gray-500">Connecte Google Calendar dans Integrations</p>
      </div>

      {/* Projets placeholder */}
      <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">💻 Projets</h3>
          <a href="/projets" className="text-xs text-indigo-400">Voir tout →</a>
        </div>
        <p className="text-sm text-gray-500">Connecte GitHub dans Integrations</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Delete GitHubWidget.tsx**

```bash
rm src/components/GitHubWidget.tsx
```

- [ ] **Step 4: Verify build passes**

- [ ] **Step 5: Commit**

```bash
git add src/components/BriefingCard.tsx src/pages/Dashboard.tsx
git add -u
git commit -m "feat: rewrite Dashboard with briefing card, top links, and module placeholders"
```

---

## Task 8: LinksCategory Page

**Files:**
- Create: `src/pages/LinksCategory.tsx`

- [ ] **Step 1: Create LinksCategory page**

```tsx
// src/pages/LinksCategory.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Category, Link } from "../types";
import { loadCategories, saveClick } from "../lib/storage";
import { LinkCard } from "../components/LinkCard";
import { useAppStore } from "../store";

export function LinksCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const searchQuery = useAppStore((s) => s.searchQuery);

  useEffect(() => {
    loadCategories(user?.id).then((cats) => {
      const cat = cats.find((c) => c.id === categoryId);
      setCategory(cat || null);
    });
  }, [categoryId]);

  if (!category) {
    return <p className="text-gray-500 text-center py-12">Categorie introuvable.</p>;
  }

  const filteredLinks = category.links.filter((link) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return link.name.toLowerCase().includes(q) || link.url.toLowerCase().includes(q);
  });

  function handleTogglePin(linkId: string) {
    const pinned = JSON.parse(localStorage.getItem("linkou-pinned") || "{}");
    pinned[linkId] = !pinned[linkId];
    if (!pinned[linkId]) delete pinned[linkId];
    localStorage.setItem("linkou-pinned", JSON.stringify(pinned));
    // Reload category
    loadCategories(user?.id).then((cats) => {
      setCategory(cats.find((c) => c.id === categoryId) || null);
    });
  }

  function handleLinkClick(link: Link) {
    const device = window.innerWidth < 768 ? "mobile" : "desktop";
    saveClick({ linkId: link.id, clickedAt: new Date().toISOString(), device });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        {category.icon} {category.name}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredLinks.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            onTogglePin={handleTogglePin}
            onClick={handleLinkClick}
          />
        ))}
      </div>
      {filteredLinks.length === 0 && (
        <p className="text-gray-500 text-center py-8">Aucun lien dans cette categorie.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LinksCategory.tsx
git commit -m "feat: add LinksCategory page for sidebar link navigation"
```

---

## Task 9: Integrations Page (OAuth prep)

**Files:**
- Create: `src/pages/Integrations.tsx`

- [ ] **Step 1: Create Integrations page**

A page listing all integrations with connect/disconnect buttons. For Phase 1, only GitHub token input works. Google/Outlook OAuth stubs show "Bientot disponible". This creates the framework for adding OAuth flows.

```tsx
// src/pages/Integrations.tsx
import { useState } from "react";

const INTEGRATIONS = [
  { id: "google", name: "Google Calendar", icon: "📅", description: "Sync tes rdv Google", status: "coming" as const },
  { id: "outlook", name: "Outlook", icon: "📧", description: "Sync tes rdv Outlook", status: "coming" as const },
  { id: "github", name: "GitHub", icon: "🐙", description: "Repos et commits", status: "available" as const },
  { id: "vercel", name: "Vercel", icon: "▲", description: "Status des deployments", status: "available" as const },
  { id: "railway", name: "Railway", icon: "🚂", description: "Services et logs", status: "available" as const },
  { id: "elevenlabs", name: "ElevenLabs", icon: "🔊", description: "Briefing vocal", status: "coming" as const },
  { id: "summeria", name: "Summeria", icon: "💳", description: "Suivi depenses", status: "coming" as const },
];

export function Integrations() {
  const [tokens, setTokens] = useState<Record<string, string>>(() => {
    return JSON.parse(localStorage.getItem("linkou-api-tokens") || "{}");
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  function saveToken(provider: string) {
    const updated = { ...tokens, [provider]: inputValue };
    setTokens(updated);
    localStorage.setItem("linkou-api-tokens", JSON.stringify(updated));
    setEditing(null);
    setInputValue("");
  }

  function removeToken(provider: string) {
    const updated = { ...tokens };
    delete updated[provider];
    setTokens(updated);
    localStorage.setItem("linkou-api-tokens", JSON.stringify(updated));
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Integrations</h2>
      <p className="text-sm text-gray-500 mb-6">
        Connecte tes services pour alimenter le dashboard.
      </p>
      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.id}
            className="bg-[#161616] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4"
          >
            <span className="text-2xl">{integration.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{integration.name}</div>
              <div className="text-xs text-gray-500">{integration.description}</div>
            </div>
            {integration.status === "coming" ? (
              <span className="text-xs text-gray-600 bg-[#1e1e1e] px-3 py-1 rounded-lg">
                Bientot
              </span>
            ) : tokens[integration.id] ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">
                  Connecte
                </span>
                <button
                  onClick={() => removeToken(integration.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Retirer
                </button>
              </div>
            ) : editing === integration.id ? (
              <div className="flex items-center gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Token API"
                  className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs outline-none focus:border-indigo-500 w-48"
                />
                <button
                  onClick={() => saveToken(integration.id)}
                  className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditing(integration.id); setInputValue(""); }}
                className="text-xs text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg hover:bg-indigo-400/20"
              >
                Connecter
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Integrations.tsx
git commit -m "feat: add Integrations page with token management"
```

---

## Task 10: Projects Page (GitHub + Vercel + Railway)

**Files:**
- Create: `src/lib/vercel-api.ts`, `src/lib/railway-api.ts`, `src/hooks/useProjects.ts`, `src/pages/Projets.tsx`
- Create: `api/vercel.ts`, `api/railway.ts`
- Modify: `src/lib/github.ts`

- [ ] **Step 1: Update github.ts to add commits**

Add to `src/lib/github.ts`:

```ts
export interface Repo {
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

export async function fetchRepoCommits(repo: string): Promise<any[]> {
  const res = await fetch(`/api/github?type=commits&repo=${repo}`);
  if (!res.ok) return [];
  return res.json();
}
```

- [ ] **Step 2: Create vercel-api.ts**

```ts
// src/lib/vercel-api.ts
export interface Deployment {
  id: string;
  name: string;
  url: string;
  state: "READY" | "BUILDING" | "ERROR" | "QUEUED";
  created: string;
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const res = await fetch("/api/vercel");
  if (!res.ok) return [];
  return res.json();
}
```

- [ ] **Step 3: Create railway-api.ts**

```ts
// src/lib/railway-api.ts
export interface RailwayService {
  name: string;
  status: string;
  url: string;
}

export async function fetchRailwayServices(): Promise<RailwayService[]> {
  const res = await fetch("/api/railway");
  if (!res.ok) return [];
  return res.json();
}
```

- [ ] **Step 4: Create api/vercel.ts serverless proxy**

```ts
// api/vercel.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return res.status(404).json({ error: "Vercel not configured" });

  const response = await fetch("https://api.vercel.com/v6/deployments?limit=10&target=production", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  const deployments = (data.deployments || []).map((d: any) => ({
    id: d.uid,
    name: d.name,
    url: d.url ? `https://${d.url}` : "",
    state: d.readyState || d.state,
    created: d.created,
  }));

  res.json(deployments);
}
```

- [ ] **Step 5: Create api/railway.ts serverless proxy**

```ts
// api/railway.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) return res.status(404).json({ error: "Railway not configured" });

  const response = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `{ me { projects { edges { node { id name services { edges { node { name } } } } } } } }`,
    }),
  });
  const data = await response.json();

  const projects = (data.data?.me?.projects?.edges || []).map((e: any) => ({
    name: e.node.name,
    status: "active",
    services: (e.node.services?.edges || []).map((s: any) => s.node.name),
  }));

  res.json(projects);
}
```

- [ ] **Step 6: Update api/github.ts to handle commits**

Add commits case to existing `api/github.ts`:

```ts
// Add inside the handler, after the repos case:
if (req.query.type === "commits" && req.query.repo) {
  const repo = req.query.repo as string;
  const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  const commits = await commitRes.json();
  return res.json((commits || []).map((c: any) => ({
    sha: c.sha?.substring(0, 7),
    message: c.commit?.message?.split("\n")[0] || "",
    date: c.commit?.author?.date || "",
    author: c.commit?.author?.name || "",
  })));
}
```

- [ ] **Step 7: Create useProjects hook**

```ts
// src/hooks/useProjects.ts
import { useEffect, useState } from "react";
import { fetchRecentRepos } from "../lib/github";
import { fetchDeployments } from "../lib/vercel-api";
import { fetchRailwayServices } from "../lib/railway-api";
import type { Project } from "../types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [repos, deployments] = await Promise.all([
        fetchRecentRepos(),
        fetchDeployments(),
      ]);

      const railwayServices = await fetchRailwayServices();

      const merged: Project[] = repos.map((repo) => {
        const deploy = deployments.find((d) => d.name === repo.name.toLowerCase());
        const railwayMatch = railwayServices.find((s) => s.name.toLowerCase() === repo.name.toLowerCase());
        return {
          name: repo.name,
          repoUrl: repo.url,
          prodUrl: deploy?.url || "",
          platform: railwayMatch ? "railway" as const : "vercel" as const,
          lastCommit: {
            message: "",
            date: repo.updatedAt,
            author: "",
          },
          deployStatus: deploy
            ? deploy.state === "READY" ? "ready" : deploy.state === "BUILDING" ? "building" : "error"
            : "unknown",
          deployDate: deploy?.created || "",
        };
      });

      setProjects(merged);
      setLoading(false);
    }
    load();
  }, []);

  return { projects, loading };
}
```

- [ ] **Step 8: Create Projets page**

```tsx
// src/pages/Projets.tsx
import { useProjects } from "../hooks/useProjects";

const STATUS_STYLES = {
  ready: { dot: "bg-green-400", label: "Deploye", labelClass: "text-green-400" },
  building: { dot: "bg-amber-400 animate-pulse", label: "Building...", labelClass: "text-amber-400" },
  error: { dot: "bg-red-400", label: "Erreur", labelClass: "text-red-400" },
  unknown: { dot: "bg-gray-600", label: "Inconnu", labelClass: "text-gray-500" },
};

export function Projets() {
  const { projects, loading } = useProjects();

  if (loading) {
    return <p className="text-gray-500 text-center py-12">Chargement des projets...</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">💻 Projets</h2>
        <p className="text-gray-500">Connecte GitHub et Vercel dans <a href="/integrations" className="text-indigo-400 hover:underline">Integrations</a></p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">💻 Projets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const status = STATUS_STYLES[project.deployStatus];
          return (
            <div
              key={project.name}
              className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{project.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-xs ${status.labelClass}`}>{status.label}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener" className="block text-gray-400 hover:text-indigo-400 truncate">
                    🐙 {project.repoUrl.replace("https://github.com/", "")}
                  </a>
                )}
                {project.prodUrl && (
                  <a href={project.prodUrl} target="_blank" rel="noopener" className="block text-gray-400 hover:text-indigo-400 truncate">
                    🌐 {project.prodUrl}
                  </a>
                )}
                {project.deployDate && (
                  <div className="text-xs text-gray-600">
                    Dernier deploy : {new Date(project.deployDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/vercel-api.ts src/lib/railway-api.ts src/hooks/useProjects.ts src/pages/Projets.tsx api/vercel.ts api/railway.ts src/lib/github.ts api/github.ts
git commit -m "feat: add Projects page with GitHub, Vercel, and Railway integration"
```

---

## Task 11: Google OAuth Flow

**Files:**
- Create: `api/auth/google.ts`, `api/auth/google-callback.ts`, `src/lib/calendar.ts`

- [ ] **Step 1: Create Google OAuth redirect endpoint**

```ts
// api/auth/google.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app"}/api/auth/google-callback`;
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  res.redirect(302, url);
}
```

- [ ] **Step 2: Create Google OAuth callback**

```ts
// api/auth/google-callback.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No code" });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code as string,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app"}/api/auth/google-callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();

  if (tokens.error) return res.status(400).json(tokens);

  // Store tokens in Supabase (using service role for server-side)
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get user from cookie/header (simplified: use query param for now)
  const userId = req.query.state as string;
  if (userId) {
    await supabase.from("integration_tokens").upsert({
      user_id: userId,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });
  }

  res.redirect(302, "/integrations?connected=google");
}
```

- [ ] **Step 3: Create calendar API client**

```ts
// src/lib/calendar.ts
import type { CalendarEvent } from "../types";

export async function fetchCalendarEvents(date: string): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/calendar?date=${date}`);
  if (!res.ok) return [];
  return res.json();
}
```

- [ ] **Step 4: Commit**

```bash
git add api/auth/google.ts api/auth/google-callback.ts src/lib/calendar.ts
git commit -m "feat: add Google OAuth flow and calendar client"
```

---

## Task 12: Outlook OAuth Flow

**Files:**
- Create: `api/auth/outlook.ts`, `api/auth/outlook-callback.ts`

- [ ] **Step 1: Create Outlook OAuth redirect** (same pattern as Elaubody)

```ts
// api/auth/outlook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = `${process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app"}/api/auth/outlook-callback`;
  const scope = encodeURIComponent("Calendars.Read offline_access User.Read");
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  res.redirect(302, url);
}
```

- [ ] **Step 2: Create Outlook OAuth callback**

```ts
// api/auth/outlook-callback.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No code" });

  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code as string,
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      redirect_uri: `${process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app"}/api/auth/outlook-callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();

  if (tokens.error) return res.status(400).json(tokens);

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const userId = req.query.state as string;
  if (userId) {
    await supabase.from("integration_tokens").upsert({
      user_id: userId,
      provider: "outlook",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });
  }

  res.redirect(302, "/integrations?connected=outlook");
}
```

- [ ] **Step 3: Commit**

```bash
git add api/auth/outlook.ts api/auth/outlook-callback.ts
git commit -m "feat: add Outlook OAuth flow"
```

---

## Task 13: Calendar API Proxy (merge Google + Outlook)

**Files:**
- Create: `api/calendar.ts`, `src/hooks/useCalendar.ts`

- [ ] **Step 1: Create calendar serverless proxy**

```ts
// api/calendar.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

async function fetchGoogleEvents(accessToken: string, date: string) {
  const timeMin = new Date(date + "T00:00:00").toISOString();
  const timeMax = new Date(date + "T23:59:59").toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map((e: any) => ({
    id: e.id,
    title: e.summary || "(Sans titre)",
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || "",
    source: "google" as const,
  }));
}

async function fetchOutlookEvents(accessToken: string, date: string) {
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${start}&endDateTime=${end}&$orderby=start/dateTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.value || []).map((e: any) => ({
    id: e.id,
    title: e.subject || "(Sans titre)",
    start: e.start?.dateTime,
    end: e.end?.dateTime,
    location: e.location?.displayName || "",
    source: "outlook" as const,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const userId = req.query.userId as string;
  if (!userId) return res.json([]);

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: tokens } = await supabase
    .from("integration_tokens")
    .select("*")
    .eq("user_id", userId)
    .in("provider", ["google", "outlook"]);

  const events: any[] = [];

  for (const token of tokens || []) {
    if (token.provider === "google") {
      events.push(...await fetchGoogleEvents(token.access_token, date));
    } else if (token.provider === "outlook") {
      events.push(...await fetchOutlookEvents(token.access_token, date));
    }
  }

  // Sort by start time
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  res.json(events);
}
```

- [ ] **Step 2: Create useCalendar hook**

```ts
// src/hooks/useCalendar.ts
import { useEffect, useState } from "react";
import { fetchCalendarEvents } from "../lib/calendar";
import { useAuth } from "./useAuth";
import type { CalendarEvent } from "../types";

export function useCalendar(date: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/calendar?date=${date}&userId=${user.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [date, user]);

  return { events, loading };
}
```

- [ ] **Step 3: Commit**

```bash
git add api/calendar.ts src/hooks/useCalendar.ts
git commit -m "feat: add calendar API proxy merging Google + Outlook events"
```

---

## Task 14: Planning Page (Full)

**Files:**
- Create: `src/pages/Planning.tsx`

- [ ] **Step 1: Create Planning page with day view**

```tsx
// src/pages/Planning.tsx
import { useState } from "react";
import { useCalendar } from "../hooks/useCalendar";

type View = "jour" | "semaine" | "mois";

export function Planning() {
  const [view, setView] = useState<View>("jour");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const { events, loading } = useCalendar(date);

  const views: { id: View; label: string }[] = [
    { id: "jour", label: "Jour" },
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
  ];

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const SOURCE_COLORS = {
    google: "border-l-blue-500",
    outlook: "border-l-orange-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">📅 Planning</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === v.id
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-8 text-center">
          <p className="text-2xl mb-3">📅</p>
          <p className="text-gray-400 mb-2">Aucun evenement pour cette date</p>
          <a href="/integrations" className="text-sm text-indigo-400 hover:underline">
            Connecter un calendrier →
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-[#161616] border border-[#1e1e1e] border-l-4 ${SOURCE_COLORS[event.source]} rounded-xl p-4 flex items-center gap-4`}
            >
              <div className="text-sm text-indigo-400 font-semibold w-14 flex-shrink-0">
                {formatTime(event.start)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{event.title}</div>
                {event.location && (
                  <div className="text-xs text-gray-500 mt-0.5">📍 {event.location}</div>
                )}
              </div>
              <div className="text-xs text-gray-600">
                {event.source === "google" ? "Google" : "Outlook"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Planning.tsx
git commit -m "feat: add Planning page with day view, Google + Outlook events"
```

---

## Task 15: Briefing API

**Files:**
- Create: `api/briefing.ts`, `src/hooks/useBriefing.ts`

- [ ] **Step 1: Create briefing serverless function**

```ts
// api/briefing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = req.query.userId as string;
  if (!userId) return res.json({ greeting: "Bonjour", summary: "Connecte-toi pour un briefing personnalise.", events: 0 });

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Count today's events
  let eventCount = 0;
  const today = new Date().toISOString().split("T")[0];
  const { data: tokens } = await supabase.from("integration_tokens").select("provider").eq("user_id", userId);
  const hasCalendar = (tokens || []).some((t) => t.provider === "google" || t.provider === "outlook");

  if (hasCalendar) {
    // Fetch from calendar API internally
    const calRes = await fetch(`${process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app"}/api/calendar?date=${today}&userId=${userId}`);
    if (calRes.ok) {
      const events = await calRes.json();
      eventCount = events.length;
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon apres-midi" : "Bonsoir";

  const parts: string[] = [];
  if (eventCount > 0) parts.push(`Tu as ${eventCount} rdv aujourd'hui.`);
  else if (hasCalendar) parts.push("Pas de rdv aujourd'hui.");

  const summary = parts.length > 0 ? parts.join(" ") : "Bonne journee !";

  res.json({ greeting, summary, events: eventCount });
}
```

- [ ] **Step 2: Create useBriefing hook**

```ts
// src/hooks/useBriefing.ts
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import type { Briefing } from "../types";

export function useBriefing() {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  useEffect(() => {
    const userId = user?.id || "";
    fetch(`/api/briefing?userId=${userId}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setBriefing);
  }, [user]);

  return briefing;
}
```

- [ ] **Step 3: Update Dashboard.tsx to use useBriefing**

Replace the hardcoded briefing object in Dashboard.tsx with:
```tsx
import { useBriefing } from "../hooks/useBriefing";
// ...
const briefing = useBriefing();
```

- [ ] **Step 4: Commit**

```bash
git add api/briefing.ts src/hooks/useBriefing.ts src/pages/Dashboard.tsx
git commit -m "feat: add briefing API with calendar event count"
```

---

## Task 16: Update Integrations Page with OAuth

**Files:**
- Modify: `src/pages/Integrations.tsx`

- [ ] **Step 1: Update Google and Outlook integrations to use OAuth**

Change the Google and Outlook entries from `status: "coming"` to `status: "oauth"`. Add a new handler for OAuth integrations that redirects to `/api/auth/google` or `/api/auth/outlook` with the user ID as state parameter. Check connection status by querying Supabase `integration_tokens` table.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Integrations.tsx
git commit -m "feat: wire Google and Outlook OAuth in Integrations page"
```

---

## Task 17: Build Verification + Deploy

- [ ] **Step 1: Run build**

```bash
npm run build
```

Fix any TypeScript errors.

- [ ] **Step 2: Run dev and verify**

Check:
- Sidebar renders with all sections
- Dashboard shows briefing + top links + placeholders
- Cmd+K opens command palette
- `/links/:categoryId` shows category links
- `/projets` shows projects (or connection prompt)
- `/planning` shows stub
- `/integrations` shows token management
- Mobile: hamburger menu works
- All old routes still work (`/stats`, `/boards`, `/settings`, `/login`)

- [ ] **Step 3: Commit any fixes**

- [ ] **Step 4: Push + deploy**

```bash
git push
npx vercel --prod --yes
```

---

## Task 18: Cleanup + Polish

- [ ] **Step 1: Remove old dashboard.html** (prototype file no longer needed)

```bash
rm dashboard.html
```

- [ ] **Step 2: Update README with new architecture**

Add section about Jarvis mode, sidebar, modules, integrations.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: remove old prototype, update README for Jarvis architecture"
git push
```
