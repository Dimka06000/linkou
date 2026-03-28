# Linkou

**Your personal digital cockpit** — a fast, self-hosted link dashboard with tracking, boards, and SaaS-ready auth.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Dashboard** — 70+ links across 15 categories, pin your most-used ones
- **Search** — instant fuzzy search across all links
- **Click tracking** — per-link stats, heatmaps, usage history
- **Boards & sharing** — curate link collections and share them publicly
- **GitHub widget** — contribution graph and repo stats on your dashboard
- **Dark mode** — system-aware, toggleable
- **Responsive** — mobile-first, works great on phone and desktop
- **Two modes** — static template (no backend) or full SaaS (Supabase auth + DB)

## Quick Start — Template Mode

No backend required. Edit JSON, deploy, done.

1. Fork this repo
2. `cp .env.example .env.local`
3. Edit `config/links.json` with your links
4. `npm install && npm run dev`
5. Deploy: `npx vercel`

## Quick Start — SaaS Mode

Multi-user with Supabase auth and persistent data.

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_initial.sql`
3. In `.env.local`, set:
   ```
   VITE_MODE=saas
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
4. `npm install && npm run dev`

## Optional Features (Phase 2)

| Feature | Service | Status |
|---------|---------|--------|
| AI video backgrounds | Runway Gen-4.5 | Coming |
| Voice announcements | ElevenLabs TTS | Coming |
| Smart link suggestions | Perplexity AI | Coming |

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Auth + DB | Supabase |
| Routing | React Router 7 |
| Deploy | Vercel |

## License

MIT
