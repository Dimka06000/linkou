# Jarvis Linkou — Design Spec

## Vision

Linkou est un OS personnel — un cockpit unifie qui aggrege planning, finances, sante, trading, projets dev, carte, et liens en une seule interface. Il se connecte aux APIs et bases de donnees des apps existantes (Statera, Tips Platform, Elaubody) sans les modifier.

Un Jarvis qui te parle le matin, te dit ou en sont tes trades, te rappelle tes supplements, et te dit quand partir pour ton prochain rdv.

## Approche

**Dashboard Aggregateur** : Linkou reste une app React standalone (Vite + Supabase). Il lit les donnees des autres apps via :
- Supabase Statera (lecture directe cross-DB)
- API Tips Platform (FastAPI sur Railway)
- Supabase Elaubody (lecture directe cross-DB)
- APIs tierces : Google Calendar, Microsoft Graph, Google Maps, Summeria, GitHub, Vercel, Railway

Un backend leger (Vercel serverless functions) orchestre les appels et protege les cles API.

## Stack Technique

| Couche | Techno |
|--------|--------|
| Frontend | React + Vite + TypeScript + Tailwind |
| State | Zustand |
| Auth + DB | Supabase (projet Linkou) |
| Hosting | Vercel |
| API Proxy | Vercel Serverless Functions |
| Voix | ElevenLabs TTS |
| Cartes | Google Maps JavaScript API + Directions API |
| Calendrier | Google Calendar API + Microsoft Graph API |
| Depenses | Summeria (scraping ou API) |
| Sante | Supabase Statera (lecture) |
| Trading | API Tips Platform (Railway) |
| Planning (Elaubody) | Supabase Elaubody (lecture) |
| Dev | GitHub API + Vercel API + Railway API |

## Layout

### Sidebar (fixe, 260px)

```
┌─────────────────────┐
│ Linkou              │
│ Dimitri Desfray     │
├─────────────────────┤
│ PRINCIPAL           │
│ 🏠 Dashboard        │
│ 📅 Planning    [3]  │
│ 💰 Finances         │
│ 🏥 Sante            │
│ 📊 Trading   [-2%]  │
│ 🗺️ Carte            │
├─────────────────────┤
│ PROJETS DEV         │
│ 💻 Statera     [✓]  │
│ 💻 Tips        [✓]  │
│ 💻 Elaubody    [✓]  │
│ 💻 Linkou      [⟳]  │
├─────────────────────┤
│ LIENS RAPIDES       │
│ 🏠 Services perso   │
│ 💰 Finance & Invest │
│ 🛠️ Design Tools     │
│ ⚙️ Automation       │
│ ... (scrollable)    │
├─────────────────────┤
│ ⚙️ Parametres       │
│ 🔗 Integrations     │
└─────────────────────┘
```

- Pages principales en haut avec badges live (nb rdv, P&L trading)
- Projets dev avec status deploy (vert/orange/rouge)
- Categories de liens comme sous-pages
- Parametres et integrations en bas
- Collapsible sur mobile (hamburger)

### Top Bar

- Recherche globale `Cmd+K` : cherche dans tous les modules (liens, rdv, trades, biomarkers, projets)
- Date/heure
- Avatar utilisateur
- Bouton notifications

### Dashboard (Page d'accueil)

Grille responsive 3 colonnes (2 sur tablette, 1 sur mobile).

**Rang 1 — Briefing Jarvis (pleine largeur)**
- Avatar IA + salutation personnalisee
- Resume du jour : nb rdv, P&L, sante, budget, prochain trajet
- Bouton "Ecouter" → ElevenLabs genere le briefing audio
- Genere cote serveur a partir des donnees de tous les modules

**Rang 2-3 — Cards modulaires**

| Card | Source | Donnees |
|------|--------|---------|
| Planning du jour | Google Calendar + Outlook | Rdv du jour, temps de trajet, alerte depart |
| Trades ouverts | API Tips Platform | Positions, P&L, total du jour |
| Sante | Supabase Statera | Score, derniers biomarkers, supplements |
| Depenses du mois | Summeria | Categories, barres budget, total |
| Projets dev | GitHub + Vercel + Railway API | Status deploy, derniers commits |
| Prochain trajet | Google Maps Directions API | Carte mini, temps, alerte depart |

Chaque card a un lien "Voir [module] →" vers la page complete.

## Modules

### M1 — Planning

**Sources :** Google Calendar API + Microsoft Graph API (Outlook)

**Vues :**
- Jour (defaut sur le dashboard)
- Semaine (comme week-calendar.tsx d'Elaubody)
- Mois (grille calendrier)

**Features :**
- Sync bidirectionnelle Google Calendar + Outlook
- Chaque rdv affiche le temps de trajet (Google Maps Directions API)
- Alerte "Pars dans X minutes" basee sur le trajet
- Tags par contexte (Pro, Perso, Sante)
- Code couleur par source (Google = bleu, Outlook = orange)

**Architecture :**
- `api/calendar.ts` — proxy serverless, merge Google + Outlook events
- `src/hooks/useCalendar.ts` — fetch + cache events
- `src/pages/Planning.tsx` — vues jour/semaine/mois
- Auth OAuth Google + Microsoft stockee en Supabase (tokens chiffres, meme pattern qu'Elaubody)

### M2 — Finances

**Sous-modules :**

**M2a — Depenses**
- Source : Summeria (a investiguer : API ou scraping)
- Fallback : import CSV/OFX depuis les banques
- Categorisation automatique
- Enveloppes budgetaires avec barres de progression
- Vue mensuelle avec comparaison mois precedent
- Alertes quand une enveloppe depasse 80%

**M2b — Investissements**
- Source : API Tips Platform (trades, equity, portfolio)
- Lecture Finary/Trade Republic si API disponible
- Vue portfolio unifiee (crypto + actions + epargne)
- P&L du jour/semaine/mois
- Equity curve

**Architecture :**
- `api/expenses.ts` — proxy Summeria
- `api/trading.ts` — proxy Tips Platform API
- `src/hooks/useExpenses.ts`, `src/hooks/useTrading.ts`
- `src/pages/Finances.tsx` — tabs Depenses / Investissements

### M3 — Sante

**Source :** Supabase Statera (lecture directe via service_role key cote serveur)

**Donnees affichees :**
- Score sante global (gauge)
- Derniers biomarkers avec tendances (fleches haut/bas)
- Biomarkers hors norme (alertes)
- Supplements du jour : checklist pris/pas pris
- Prochains rdv medicaux (filtre du planning)
- Lien "Ouvrir Statera →" pour le detail complet

**Architecture :**
- `api/health.ts` — lit Supabase Statera, retourne un resume
- `src/hooks/useHealth.ts`
- `src/pages/Sante.tsx`

### M4 — Trading

**Source :** API Tips Platform (FastAPI sur Railway)

**Donnees affichees :**
- Trades ouverts avec P&L temps reel
- Bots actifs (nom, strategie, status)
- Equity curve mini (sparkline)
- P&L jour/semaine/mois
- Alertes : drawdown, circuit breaker, position fermee
- Lien "Ouvrir Tips →" pour agir (configurer bots, lancer backtest)

**Architecture :**
- `api/trading.ts` — proxy vers Tips Platform API (auth JWT)
- `src/hooks/useTrading.ts`
- `src/pages/Trading.tsx`

### M5 — Carte

**Source :** Google Maps JavaScript API + Directions API + Places API

**Features :**
- Carte interactive plein ecran (Google Maps embed)
- Recherche de lieux (Places autocomplete)
- Trajets du jour superposes sur la carte (depuis le planning)
- Temps de route en temps reel
- Click sur un rdv du planning → itineraire affiche

**Architecture :**
- `src/pages/Carte.tsx` — Google Maps React wrapper
- `src/hooks/useDirections.ts` — calcul trajets
- Cle API Google Maps (Maps JS + Directions + Places)

### M6 — Liens & Outils

**Le dashboard actuel refactore en sous-pages de la sidebar.**

- Chaque categorie = une page dans la sidebar
- Page categorie : grille de LinkCards avec recherche, favoris, badges
- Tracking d'usage (clics logges)
- Stats d'usage (top liens, heatmap)
- Boards partageables

### M7 — Projets Dev

**Sources :** GitHub API + Vercel API + Railway API + Supabase Management API

**Par projet :**
- Nom + repo GitHub
- Dernier commit (message, date, auteur)
- Status deploy (Vercel ou Railway)
- URL prod
- DB status (Supabase)
- Liens rapides : repo, dashboard Vercel/Railway, Supabase dashboard

**Architecture :**
- `api/github.ts` — repos + commits (existe deja)
- `api/vercel.ts` — deployments via Vercel API
- `api/railway.ts` — services via Railway API
- `src/pages/Projets.tsx` — vue globale + page detail par projet

## Transversal

### Recherche globale (Cmd+K)

- Modal plein ecran avec input
- Recherche dans : liens, rdv, trades, biomarkers, projets, depenses
- Resultats groupes par module avec icone
- Navigation clavier (fleches + Enter)
- Fuzzy search
- Raccourci `/` pour focus rapide (comme avant)

### Briefing vocal

- Au chargement du dashboard, le serveur genere un texte de briefing
- `api/briefing.ts` — aggrege les donnees de tous les modules, genere un texte
- Bouton "Ecouter" → appel ElevenLabs TTS, lecture audio
- Voix configurable dans les parametres

### Notifications / Badges

- Badges live dans la sidebar
- Planning : nombre de rdv du jour
- Trading : P&L du jour (vert/rouge)
- Depenses : alerte si enveloppe > 80%
- Sante : supplements non pris
- Projets : deploy en cours ou echoue
- Refresh automatique toutes les 60 secondes

### Page Integrations

- Liste de toutes les integrations avec status (connecte/deconnecte)
- Google : OAuth flow → tokens chiffres en Supabase
- Outlook : OAuth flow (meme pattern qu'Elaubody)
- Summeria : credentials chiffres
- Tips Platform : URL API + JWT token
- GitHub : Personal Access Token
- Vercel : Token API
- Railway : Token API
- ElevenLabs : API key
- Google Maps : API key

### Mobile

- Sidebar collapse en hamburger menu
- Dashboard : 1 colonne, cards empilees
- Briefing vocal = ideal sur mobile (pas besoin de lire)
- Carte : plein ecran
- Planning : vue jour par defaut
- Bottom nav optionnel (Dashboard, Planning, Finances, Plus...)

## Schema Base de Donnees (Supabase Linkou)

Les donnees des autres apps restent dans leurs Supabase respectifs. Linkou stocke uniquement :

### integration_tokens
- `id` UUID PK
- `user_id` UUID FK → auth.users
- `provider` TEXT (google, outlook, summeria, tips, github, vercel, railway, elevenlabs)
- `access_token` TEXT (chiffre)
- `refresh_token` TEXT (chiffre)
- `expires_at` TIMESTAMPTZ
- `metadata` JSONB

### user_preferences
- `id` UUID PK → auth.users
- `sidebar_order` JSONB (ordre des modules)
- `dashboard_layout` JSONB (ordre des cards)
- `voice_id` TEXT (voix ElevenLabs)
- `theme` TEXT (dark/light)
- `default_calendar_view` TEXT (jour/semaine/mois)

### expense_budgets
- `id` UUID PK
- `user_id` UUID FK
- `category` TEXT
- `monthly_limit` NUMERIC
- `icon` TEXT

### notifications
- `id` UUID PK
- `user_id` UUID FK
- `module` TEXT (planning/trading/health/expenses/projects)
- `message` TEXT
- `read` BOOLEAN DEFAULT false
- `created_at` TIMESTAMPTZ

Tables existantes conservees : categories, links, clicks, boards, board_links, profiles.

## Serverless Functions (api/)

| Endpoint | Source | Auth |
|----------|--------|------|
| `api/briefing.ts` | Tous les modules | User token |
| `api/calendar.ts` | Google Calendar + Outlook | OAuth tokens |
| `api/expenses.ts` | Summeria | Credentials |
| `api/health.ts` | Supabase Statera | Service role key |
| `api/trading.ts` | Tips Platform API | JWT |
| `api/github.ts` | GitHub API | PAT |
| `api/vercel.ts` | Vercel API | Token |
| `api/railway.ts` | Railway API | Token |
| `api/directions.ts` | Google Maps Directions | API key |
| `api/tts.ts` | ElevenLabs | API key |
| `api/auth/google.ts` | Google OAuth | - |
| `api/auth/outlook.ts` | Microsoft OAuth | - |

## Phases de livraison

### Phase 1 — Shell + Planning + Liens
- Layout (sidebar, topbar, Cmd+K)
- Dashboard avec briefing (texte seulement)
- Module Planning (Google Calendar + Outlook)
- Module Liens (refactor de l'existant en sous-pages sidebar)
- Module Projets Dev (GitHub + Vercel status)
- Page Integrations (OAuth flows)
- Mobile responsive

### Phase 2 — Finances + Sante + Trading
- Module Depenses (Summeria)
- Module Trading (API Tips Platform)
- Module Sante (lecture Supabase Statera)
- Briefing vocal (ElevenLabs)
- Notifications / badges live

### Phase 3 — Carte + Polish
- Module Carte (Google Maps embed + Directions)
- Trajets lies au planning
- Alertes "pars dans X min"
- Dashboard cards reorganisables (drag & drop)
- Themes visuels (Runway — Phase 2 du spec original)

## Principes

- **Lecture d'abord** : Linkou lit, il ne modifie pas les autres apps (sauf le planning qui est bidirectionnel)
- **Zero saisie** : tout est automatique (sync calendriers, sync depenses, lecture trades)
- **Offline graceful** : si une API est down, la card affiche "Indisponible" pas un crash
- **Tokens chiffres** : tous les tokens OAuth/API sont chiffres en base (meme pattern qu'Elaubody)
- **Mobile-first** : le briefing vocal remplace la lecture sur mobile
- **Open source** : template forkable, chaque integration est un module desactivable
