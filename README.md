# Linkou — Jarvis

**Your personal digital cockpit** — a fast, self-hosted link dashboard with tracking, boards, integrations, and SaaS-ready auth.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Jarvis Architecture

Jarvis is the Linkou SaaS experience — a sidebar-based cockpit with AI briefing and live integrations.

### Sidebar Layout

The app uses a persistent left sidebar (`Sidebar.tsx`) with navigation links to all modules. On mobile, the sidebar collapses to a bottom nav bar. The main content area is scrollable and renders the active module.

### Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Briefing card, top links, pinned favorites, calendar preview |
| Planning | `/planning` | Google Calendar + Outlook events with travel time |
| Projets | `/projets` | GitHub repos, Vercel/Railway deployment status |
| Links | `/links` | Full link manager with categories, drag & drop |
| Integrations | `/integrations` | Connect services via token or OAuth |

### Briefing API

`api/briefing.ts` — Vercel serverless function returning a time-aware greeting and summary. The `useBriefing()` hook fetches it on mount with a client-side fallback for dev mode.

### Integrations & OAuth

The Integrations page (`src/pages/Integrations.tsx`) handles three types of connections:

- **OAuth** (Google Calendar, Outlook) — redirects to `/api/auth/{provider}?userId=xxx`, detects `?connected=provider` on return
- **Token** (GitHub, Vercel, Railway) — paste a personal access token, stored in localStorage
- **Coming soon** (ElevenLabs, Summeria) — placeholder badges

OAuth endpoints live in `api/auth/` (google.ts, outlook.ts, callback.ts).

### Calendar OAuth Flow

1. User clicks "Connecter" on Google or Outlook
2. Redirected to `/api/auth/google?userId=xxx`
3. Provider OAuth flow completes
4. Callback at `/api/auth/callback` stores token in Supabase
5. User redirected back to `/integrations?connected=google`
6. Page detects param, marks as connected, shows toast

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
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_APP_URL=https://your-app.vercel.app
   ```
4. `npm install && npm run dev`

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MODE` | Yes | `template` or `saas` |
| `VITE_SUPABASE_URL` | SaaS | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | SaaS | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | SaaS | Server-side Supabase key |
| `VITE_APP_URL` | SaaS | App URL for OAuth redirects |
| `GOOGLE_CLIENT_ID` | OAuth | Google Calendar OAuth |
| `OUTLOOK_CLIENT_ID` | OAuth | Outlook OAuth |

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Auth + DB | Supabase |
| Routing | React Router 7 |
| Deploy | Vercel (serverless API routes) |

## License

MIT
