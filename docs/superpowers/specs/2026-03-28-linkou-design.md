# Linkou — Design Spec

## Vision

Linkou est un cockpit numerique personnel — un hub centralisant liens, plateformes et outils avec tracking d'usage, visuels generes par IA, et partage social.

**Deux modes de distribution :**
- **Template open source** — fork le repo, configure `links.json` + `.env`, deploy ton hub perso
- **SaaS (linkou.app)** — inscription, chaque user gere ses liens dans l'app, zero config

Le meme codebase supporte les deux modes via un flag `VITE_MODE=template|saas`.

## Stack Technique

| Couche | Techno |
|--------|--------|
| Frontend | React + Vite + TypeScript |
| State | Zustand |
| Auth + DB | Supabase (mode SaaS) / localStorage (mode template) |
| Hosting | Vercel |
| API Proxy | Vercel Serverless Functions |
| IA Visuals | Runway API (Gen-4 Image Turbo, Gen-4.5, Aleph, Characters) |
| TTS | ElevenLabs |
| Dev Feed | GitHub API |

## Modes de fonctionnement

### Mode Template (`VITE_MODE=template`)
- Liens definis dans `config/links.json`
- Categories dans `config/theme.json`
- Auth desactivee (single user)
- Tracking via localStorage
- Features IA activees par presence des cles API dans `.env`
- Deploy en static sur Vercel/Netlify/n'importe ou

### Mode SaaS (`VITE_MODE=saas`)
- Auth Supabase (email/password + OAuth Google) — meme pattern que Tips Platform
- Liens geres dans l'app (CRUD)
- Tracking en base Supabase
- Partage de boards via liens publics
- Features IA activees par presence des cles API

## Architecture

```
linkou/
├── config/
│   ├── links.json            # Liens et categories (mode template)
│   └── theme.json            # Preferences visuelles
├── src/
│   ├── components/           # UI partagee
│   │   ├── LinkCard.tsx
│   │   ├── CategorySection.tsx
│   │   ├── SearchBar.tsx
│   │   ├── PinnedSection.tsx
│   │   └── StatsPanel.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx     # Page principale
│   │   ├── Stats.tsx         # Analytics d'usage
│   │   ├── Settings.tsx      # Config user
│   │   ├── SharedBoard.tsx   # Vue publique d'un board
│   │   └── Auth.tsx          # Login/Register (SaaS only)
│   ├── features/             # Modules activables
│   │   ├── tracking/         # Logging des clics + analytics
│   │   ├── ai-visuals/       # Thumbnails, fonds, themes Runway
│   │   ├── github-feed/      # Repos, commits, activite
│   │   ├── sharing/          # Boards publics partageables
│   │   └── recap-video/      # Recap hebdo Gen-4.5 + ElevenLabs
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth Supabase ou noop (template)
│   │   ├── useLinks.ts       # CRUD liens (Supabase ou JSON)
│   │   ├── useTracking.ts    # Log clics + stats
│   │   └── useFeature.ts     # Check si une feature est activee
│   ├── lib/
│   │   ├── supabase.ts       # Client Supabase
│   │   ├── runway.ts         # Client Runway API
│   │   ├── github.ts         # Client GitHub API
│   │   ├── elevenlabs.ts     # Client ElevenLabs
│   │   └── storage.ts        # Abstraction localStorage/Supabase
│   ├── store/
│   │   └── index.ts          # Zustand store
│   └── types/
│       └── index.ts
├── api/                      # Vercel serverless functions
│   ├── runway.ts             # Proxy Runway (protege API key)
│   ├── github.ts             # Proxy GitHub
│   └── elevenlabs.ts         # Proxy ElevenLabs
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── .env.example
├── package.json
└── vite.config.ts
```

## Schema Base de Donnees (Supabase — mode SaaS)

### users
- `id` UUID PK (Supabase auth.users)
- `email` TEXT
- `display_name` TEXT
- `avatar_url` TEXT
- `theme_config` JSONB (couleurs, layout, theme IA genere)
- `created_at` TIMESTAMPTZ

### categories
- `id` UUID PK
- `user_id` UUID FK → users
- `name` TEXT
- `icon` TEXT
- `position` INT
- `background_video_url` TEXT (fond anime Runway)
- `is_collapsed` BOOLEAN DEFAULT false

### links
- `id` UUID PK
- `user_id` UUID FK → users
- `category_id` UUID FK → categories
- `name` TEXT
- `url` TEXT
- `thumbnail_url` TEXT (favicon ou thumbnail IA)
- `badge` TEXT (prod/test/staging)
- `position` INT
- `is_pinned` BOOLEAN DEFAULT false

### clicks
- `id` UUID PK
- `user_id` UUID FK → users
- `link_id` UUID FK → links
- `clicked_at` TIMESTAMPTZ DEFAULT now()
- `device` TEXT (desktop/mobile)

### boards
- `id` UUID PK
- `user_id` UUID FK → users
- `name` TEXT
- `slug` TEXT UNIQUE
- `is_public` BOOLEAN DEFAULT false
- `description` TEXT

### board_links
- `board_id` UUID FK → boards
- `link_id` UUID FK → links
- `position` INT

### RLS (Row Level Security)
- Chaque user ne voit que ses propres donnees
- Les boards publics sont lisibles par tous via le slug
- Les clicks ne sont accessibles que par leur owner

## Features Detaillees

### F1 — Dashboard (Phase 1)
- Affichage des liens par categories collapsibles
- Barre de recherche fuzzy (raccourci `/`, `Escape` pour reset)
- Favoris epingles en haut (etoile toggle)
- Badges visuels : PROD (vert), TEST (orange), STAGING (bleu)
- Favicons automatiques via Google S2
- Compteur de liens par categorie
- Responsive mobile-first

### F2 — Tracking d'usage (Phase 1)
- Chaque clic sur un lien est logge (link_id, timestamp, device)
- Page Stats avec :
  - Top 10 liens les plus utilises
  - Frequence d'utilisation par jour/semaine
  - Heatmap d'activite (jour x heure)
  - Liens non utilises depuis X jours
  - Derniers liens cliques
- Mode template : localStorage, donnees locales uniquement
- Mode SaaS : table `clicks` en Supabase

### F3 — Partage / Boards (Phase 1)
- Creer des boards (collections thematiques de liens)
- Chaque board a un slug unique → URL publique `/board/:slug`
- Vue publique en lecture seule, branding Linkou
- Partage en un clic (copier le lien)
- Mode template : pas de partage (single user)

### F4 — GitHub Integration (Phase 1)
- Widget sur le dashboard : derniers repos, derniers commits
- Auto-detection des repos via GitHub API
- Liens auto-generes vers les repos avec badge (public/private)
- Activable via `GITHUB_TOKEN` dans `.env`

### F5 — Thumbnails IA (Phase 2)
- Chaque lien peut avoir une thumbnail generee par Runway Gen-4 Image Turbo
- Prompt auto-genere depuis le nom + categorie du lien
- Cout : $0.02 par thumbnail
- Bouton "regenerer" pour chaque lien
- Fallback sur favicon si pas de cle Runway
- Cache en Supabase Storage ou CDN

### F6 — Fonds animes par categorie (Phase 2)
- Chaque categorie a un fond video en boucle (5s)
- Genere par Gen-4.5 avec un prompt lie a la categorie
- Stocke en Supabase Storage, serve en `<video>` avec autoplay/loop/muted
- Bouton "regenerer le fond" dans les settings de categorie
- Cout : ~$1.20 par fond
- Fallback : fond statique CSS gradient

### F7 — Themes generes (Phase 2)
- L'utilisateur decrit une ambiance en texte ("cyberpunk neon", "foret zen")
- Runway Gen-4 Image genere une image d'ambiance
- Extraction de palette de couleurs depuis l'image (algorithme cote client)
- Application auto des couleurs au theme du dashboard
- Stocke dans `theme_config` JSONB

### F8 — Transitions cinematiques (Phase 2)
- Transitions entre vues generees par Aleph (style transfer)
- Set de 4-5 transitions pre-generees, stockees en cache
- Activees au changement de page/vue
- Cout : ~$5 pour un set complet

### F9 — Suggestions contextuelles (Phase 2)
- Scoring simple : jour_semaine + heure → top liens predits
- Section "Suggestions" en haut du dashboard
- Pas de ML — un scoring pondere sur l'historique des clicks
- "Tu utilises souvent GitHub le lundi matin" → GitHub en suggestion

### F10 — Avatar assistant (Phase 3)
- Runway Characters API — avatar genere depuis une image
- Accueil personnalise : "Salut Dimitri, 3 jours sans Finary"
- Session WebRTC (max 5 min)
- Knowledge base = habitudes d'usage extraites du tracking
- Cout : ~$0.20 par interaction

### F11 — Recap video hebdo (Phase 3)
- Genere chaque dimanche via cron/serverless
- Gen-4.5 pour les visuels (stats animees, highlights)
- ElevenLabs pour la voix off
- "Cette semaine : 47 liens, top 3 = GitHub, Gmail, Finary"
- Video de 15-30s, partageable
- Cout : ~$2-3 par recap

### F12 — Heatmap mode (Phase 3)
- Vue alternative du dashboard
- Les liens sont des tuiles dont la taille/couleur reflete la frequence d'usage
- Les liens peu utilises retrecissent et palissent
- Toggle entre mode "liste" et mode "heatmap"

### F13 — Command Palette (Phase 3)
- Mode Raycast : `Cmd+K` ouvre un champ de recherche plein ecran
- Fuzzy search sur tous les liens
- Ordre des resultats pondere par frequence d'usage (tracking)
- Navigation clavier complete
- Raccourci rapide depuis n'importe quelle page

## Configuration (.env.example)

```bash
# Mode
VITE_MODE=template              # template | saas

# Supabase (requis en mode saas, optionnel en template)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Features optionnelles — activees par presence de la cle
RUNWAY_API_KEY=                  # Thumbnails IA, fonds, themes, avatar, recap
ELEVENLABS_API_KEY=              # Voix pour recap video
GITHUB_TOKEN=                    # Feed GitHub
```

## Phases de livraison

### Phase 1 — MVP
Objectif : dashboard fonctionnel avec tracking et partage.
- F1 Dashboard
- F2 Tracking
- F3 Partage/Boards
- F4 GitHub Integration
- Auth Supabase (mode SaaS)
- Deploy Vercel

### Phase 2 — IA & Visuels
Objectif : le dashboard devient visuellement unique grace a Runway.
- F5 Thumbnails IA
- F6 Fonds animes
- F7 Themes generes
- F8 Transitions
- F9 Suggestions contextuelles

### Phase 3 — Immersif
Objectif : experience premium, effet wow.
- F10 Avatar assistant
- F11 Recap video
- F12 Heatmap mode
- F13 Command Palette

## Principes de design

- **Feature flags implicites** : pas de cle API = feature desactivee, pas d'erreur
- **Config over code** : `links.json` + `.env` = zero code pour personnaliser
- **Mobile-first** : tout fonctionne sur mobile, layouts adaptatifs
- **Performance** : videos lazy-loaded, thumbnails en cache, search instantanee
- **Accessibilite** : navigation clavier, contrastes suffisants, pas de dependance aux animations
- **Open source** : MIT license, bien documente, facile a forker
