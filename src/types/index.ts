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

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  source: "google" | "outlook";
  tag?: string;
  travelTime?: number;
  travelMode?: string;
}

export interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export interface Project {
  name: string;
  repoUrl: string;
  prodUrl: string;
  platform: "vercel" | "railway";
  description: string;
  language: string;
  stars: number;
  lastCommit: {
    message: string;
    date: string;
    author: string;
  };
  commits: Commit[];
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
