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
