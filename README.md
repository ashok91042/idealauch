# 🚀 IDEALAUNCH — React + Next.js + Tailwind CSS + Node.js/Express backend

Converted from vanilla HTML/CSS/JS (original backed up in `legacy/`).

## Stack
- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS 3 (component classes in `app/globals.css`)
- **Backend:** Node.js + Express + JWT auth + bcryptjs, **PostgreSQL database (Supabase)** via `pg`
- Client-side fallback: if the API is unreachable the app keeps working with localStorage (same keys as before: `ideaUser`, `ideaUsers`, `ideaCustom`, `ideaSaved`)

## Project structure
```
IDEALAUNCH_Red_UI/
├─ app/                    # Next.js App Router pages (frontend)
│  ├─ layout.jsx           # Root layout — loads globals.css + AppProvider
│  ├─ globals.css          # Tailwind + reusable component classes (.btn, .card, .input…)
│  ├─ page.jsx             # /          — Sign In / Sign Up (backend auth)
│  ├─ dashboard/page.jsx   # /dashboard — stats, hero, categories
│  ├─ explore/page.jsx     # /explore   — search + filter + sort (?q=&category=)
│  ├─ saved/page.jsx       # /saved     — favourites grid
│  ├─ details/page.jsx     # /details   — full idea view (?id=) save/share/delete
│  └─ profile/page.jsx     # /profile   — account card, edit profile (API-backed)
├─ components/             # Reusable UI
│  ├─ AppShell.jsx         # Sidebar + Topbar + NewIdea modal + Toast wrapper
│  ├─ Sidebar.jsx          # nav + "+ New Idea" + logout
│  ├─ Topbar.jsx           # header search + "+ New Idea" + user chip
│  ├─ IdeaCard.jsx         # card with save / view / delete
│  ├─ NewIdeaModal.jsx     # validated publish form (POST /api/ideas)
│  └─ Toast.jsx            # global toast
├─ lib/                    # Frontend logic
│  ├─ store.jsx            # React Context (auth, ideas, saved, toast) + API/offline fallback
│  ├─ api.js               # fetch wrapper with Bearer token
│  ├─ ideas.js             # seed ideas + category/icon constants
│  └─ useProtected.js      # redirect-to-login helper
├─ server/                 # Backend (Node.js + Express + PostgreSQL/Supabase)
│  ├─ index.js             # REST API: auth (JWT) + ideas + saved (SQL queries)
│  ├─ db.js                # pg Pool + schema auto-creation + seeding
│  ├─ smoke-test.js        # 18-request end-to-end API test
│  ├─ cleanup-test-users.js# removes smoke-test accounts from the DB
│  ├─ package.json         # express, cors, bcryptjs, jsonwebtoken, pg, dotenv
│  ├─ .env                 # real credentials (gitignored)
│  └─ .env.example         # template with placeholders
├─ legacy/                 # original static HTML/CSS/JS (backup)
├─ tailwind.config.js      # brand colors, animations, shadows
├─ next.config.js / postcss.config.js / jsconfig.json (@/ alias)
└─ package.json            # root scripts: dev, build, server, smoke
```

## Routes
| Route | File | Old page |
|---|---|---|
| `/` | `app/page.jsx` | `index.html` — Sign In / Sign Up |
| `/dashboard` | `app/dashboard/page.jsx` | `dashboard.html` |
| `/explore` | `app/explore/page.jsx` | `explore.html` |
| `/saved` | `app/saved/page.jsx` | `saved.html` |
| `/details?id=` | `app/details/page.jsx` | `details.html` |
| `/profile` | `app/profile/page.jsx` | `profile.html` |

## Components (`components/`)
- `AppShell.jsx` — Sidebar + Topbar + NewIdea modal + Toast wrapper
- `Sidebar.jsx`, `Topbar.jsx` (both include **+ New Idea** button)
- `IdeaCard.jsx` — save/unsave, view, delete (own ideas)
- `NewIdeaModal.jsx` — validated new-idea form, persists to localStorage
- `Toast.jsx`

## State (`lib/`)
- `lib/ideas.js` — 8 seed ideas + category/icon choices
- `lib/store.jsx` — React Context: user, auth, custom ideas, saved, toast; talks to the Express API when it's up, localStorage otherwise
- `lib/api.js` — tiny fetch wrapper (adds `Authorization: Bearer <token>` from `localStorage.ideaToken`)
- `lib/useProtected.js` — redirect-to-login helper

## Backend (`server/`)
Node.js + Express REST API with JWT auth, backed by **PostgreSQL on Supabase** (pool `pg`, schema auto-created and seeded with the 8 starter ideas on first run).

Tables: `users` (id, name, email, pass_hash), `ideas` (title, category, icon, description, problem, solution, features JSONB, likes, author_id), `saved_ideas` (user_id × idea_id, cascade delete).

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | health check |
| POST | `/api/auth/signup` | — | register (bcrypt-hashed password) → JWT + user |
| POST | `/api/auth/signin` | — | login (account must exist - sign up first) |
| GET | `/api/auth/me` | ✅ | current user from token |
| PUT | `/api/auth/profile` | ✅ | update name / email |
| GET | `/api/ideas?q=&category=&sort=` | — | list, search, filter, sort ideas |
| GET | `/api/ideas/:id` | — | single idea |
| POST | `/api/ideas` | ✅ | publish a new idea (validated) |
| DELETE | `/api/ideas/:id` | ✅ | delete own idea |
| POST | `/api/ideas/:id/like` | — | +1 like |
| GET | `/api/saved` | ✅ | saved ids + ideas for current user |
| POST | `/api/saved/:id` | ✅ | toggle save / unsave |

### Run backend + frontend
```bash
# terminal 1 — API on http://localhost:5000
npm run server        # (or: cd server && npm install && npm run dev)

# terminal 2 — Next.js on http://localhost:3000
npm run dev
```
Sign up / sign in on `/` — accounts, published ideas and saved lists now live on the server. If the API is off, the app silently falls back to localStorage mode.

### Config
Credentials live in `server/.env` (gitignored): `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `DATABASE_URL` (Supabase pooler string — **URL-encode special chars in the password**, e.g. `@` → `%40`). See `server/.env.example`. Set `NEXT_PUBLIC_API_URL` in a root `.env.local` for a custom API URL (or `""` to force offline mode). The Supabase *anon key* is only needed for Supabase's auto-generated REST/JS client — this backend talks to Postgres directly, so it isn't used.

### Test the API
```bash
npm run smoke   # 18-request end-to-end test against http://localhost:5000
```

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build
```bash
npm run build
npm start
```
