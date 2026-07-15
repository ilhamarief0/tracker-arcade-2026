# Google Skills Arcade 2026 Tier Calculator

> A web calculator for Google Skills Arcade 2026 participants. Paste a public Google Skills profile URL and the app checks which official Arcade games and skill badges are visible, calculates Arcade Points, and determines the prize tier.

**Created by [Ilham Arief](https://github.com/ilhamarief0)** | **Link [Public Url](https://arcade.ilhamarief.my.id)** | **[Repository](https://github.com/ilhamarief0/tracker-arcade-2026)**

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Admin Login](#admin-login)
- [Deployment](#deployment)
  - [Vercel (Recommended)](#option-1-vercel-recommended)
  - [Railway / Render / Fly.io / VPS](#option-2-railway--render--flyio--vps)
  - [Split Frontend and Backend](#option-3-split-frontend-and-backend)
- [Project Scripts](#project-scripts)
- [Point System](#point-system)
- [Notes](#notes)

---

## Features

- **Profile URL checker** — paste a Google Skills / Cloud Skills Boost public profile URL to check progress.
- **Official tier calculator** — only badges from the official Arcade 2026 program are counted.
- **Tier system**:
  | Tier | Points Required | Total Spots |
  |------|----------------|-------------|
  | Arcade Trooper | 50 | 6,000 |
  | Arcade Ranger | 75 | 4,000 |
  | Arcade Champion | 95 | 3,000 |
  | Arcade Legend | 120 | 2,500 |
- **Official lab list** — direct links to Arcade games and skill badge courses with access codes.
- **Bilingual UI** — English and Indonesian language selector.
- **Admin tools** (hidden, URL-only access):
  - Check history (visible only after admin login at `/auth/login`).
  - Refresh official Arcade game / skill list from the official page.
- **No database** — history, session, language, and resources stored in browser `localStorage`.

---

## How It Works

1. User pastes a public profile URL (e.g. `https://www.skills.google/public_profiles/...`).
2. Frontend sends `POST /api/check-profile` to the backend.
3. Backend fetches the profile HTML, parses visible badges, and matches them against the official Arcade 2026 game and skill badge list.
4. Backend returns: matched games, matched skill badges, Arcade Points, and detected tier.
5. Frontend displays the result with tier progress, missing points, and detected items.

Admin can also call `GET /api/official-arcade` (protected with Bearer token) to refresh the official game/skill list from `go.cloudskillsboost.google/arcade`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Express 5 (local dev), Vercel Serverless Functions (production) |
| HTML Parsing | Cheerio |
| Linting | Oxlint |

---

## Project Structure

```
tracker-arcade/
├── api/                          # Vercel Serverless Functions
│   ├── _lib.js                   # Shared logic (auth, parsing, matching)
│   ├── check-profile.js          # POST /api/check-profile
│   ├── admin-login.js            # POST /api/admin-login
│   └── official-arcade.js        # GET  /api/official-arcade (admin only)
├── server/
│   └── profile-checker.js        # Express backend (local dev + Node hosting)
├── src/
│   ├── components/               # (reserved for future components)
│   ├── constants/
│   │   ├── labs.ts               # Official game + skill badge links
│   │   ├── storage.ts            # localStorage keys
│   │   └── tiers.ts              # Tier rules (Trooper, Ranger, Champion, Legend)
│   ├── i18n/
│   │   └── copy.ts               # Bilingual text dictionary (EN + ID)
│   ├── lib/
│   │   └── arcade.ts             # Utility functions (points, tier, CSV, etc.)
│   ├── types/
│   │   └── arcade.ts             # TypeScript types
│   ├── App.tsx                   # Main application component
│   ├── App.css                   # Application styles
│   ├── index.css                 # Global styles + fonts
│   └── main.tsx                  # React entry point
├── .env                          # Environment variables (local, NOT committed)
├── .env.example                  # Template for environment variables
├── vercel.json                   # Vercel deployment config (SPA rewrites)
├── vite.config.js                # Vite config with Express API middleware
├── package.json
└── tsconfig.json
```

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/ilhamarief0/tracker-arcade-2026.git
cd tracker-arcade-2026
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
ADMIN_USERNAME=developer
ADMIN_PASSWORD_HASH=da1d9dabb3400ae28465285a6c496cff9fbbb1e4a75e1ad98c74d26019180300
ADMIN_TOKEN=da1d9dabb3400ae28465285a6c496cff9fbbb1e4a75e1ad98c74d26019180300
```

> See [Environment Variables](#environment-variables) for how to generate your own hash and token.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

During development, `vite.config.js` mounts the Express API router automatically, so all `/api/*` endpoints are available from the same dev server.

### 5. Build for production

```bash
npm run build
```

### 6. Run the production server locally

```bash
npm start
```

Open [http://localhost:4174](http://localhost:4174). Override the port with `PORT=3000 npm start`.

---

## Environment Variables

All admin credentials are read from environment variables. No passwords or tokens are stored in the frontend bundle.

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_USERNAME` | Admin login username | Yes |
| `ADMIN_PASSWORD_HASH` | SHA-256 hash of the admin password | Yes |
| `ADMIN_TOKEN` | Secret token for admin API authentication | Yes |
| `PORT` | Server port (default: `4174`, only for Node hosting) | No |

### Generate a password hash

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### Generate a random token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Admin Login

Admin login is **not visible** on the main page. Access it at:

```
https://your-domain.com/auth/login
```

After login, the admin can:
- View check history for all profile checks performed in the browser.
- Refresh the official Arcade game and skill badge list.
- Export check history as CSV.

After logout or closing the browser, the admin session persists in `localStorage` until explicitly logged out.

---

## Deployment

### Option 1: Vercel (Recommended)

This project includes Vercel Serverless Functions in the `api/` directory, so all features work on Vercel without a separate backend.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
vercel
```

Vercel will auto-detect the Vite framework. Use these settings if prompted:

```
Framework Preset: Vite
Build Command:    npm run build
Output Directory: dist
Install Command:  npm install
```

#### Step 4: Set environment variables

In the Vercel dashboard, go to **Project → Settings → Environment Variables** and add:

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `developer` |
| `ADMIN_PASSWORD_HASH` | `<your-sha256-hash>` |
| `ADMIN_TOKEN` | `<your-random-token>` |

Or use the CLI:

```bash
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD_HASH
vercel env add ADMIN_TOKEN
```

#### Step 5: Redeploy with environment variables

```bash
vercel --prod
```

#### How Vercel routing works

- `vercel.json` rewrites all non-API routes to `/index.html` for SPA client-side routing.
- Files in `api/` are deployed as Vercel Serverless Functions.
- `api/_lib.js` contains shared logic used by all three API endpoints.
- The Express backend in `server/` is **not used** on Vercel (only for local/Node hosting).

---

### Option 2: Railway / Render / Fly.io / VPS

Use this if you prefer running the Express backend directly.

#### Build command

```bash
npm install && npm run build
```

#### Start command

```bash
npm start
```

#### Environment variables

Set these on your hosting platform:

```
ADMIN_USERNAME=developer
ADMIN_PASSWORD_HASH=<sha256-password-hash>
ADMIN_TOKEN=<your-random-token>
PORT=4174
```

> If your platform injects its own `PORT`, you do not need to set it manually.

#### Example: Railway

1. Connect your GitHub repo to [Railway](https://railway.app).
2. Railway auto-detects Node.js and runs `npm install` + `npm run build`.
3. Set the start command to `npm start`.
4. Add environment variables in the Railway dashboard.
5. Deploy.

#### Example: Render

1. Connect your GitHub repo to [Render](https://render.com).
2. Create a new **Web Service**.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add environment variables in the Render dashboard.
6. Deploy.

---

### Option 3: Split Frontend and Backend

Deploy the frontend and backend separately:

- **Frontend**: Vercel / Netlify / Cloudflare Pages (static only, without `api/` directory).
- **Backend**: Railway / Render / Fly.io / VPS (Express server from `server/profile-checker.js`).

Then update the frontend API calls in `src/App.tsx` from relative paths:

```ts
fetch('/api/check-profile')
```

to your backend URL:

```ts
fetch('https://your-backend.example.com/api/check-profile')
```

If deploying this way, configure CORS on the Express backend before production use.

---

## Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with Express API middleware |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run Oxlint |
| `npm run server` | Start Express API server only |
| `npm start` | Start production Express server and serve `dist/` |
| `npm run preview` | Preview static Vite build (no API) |

---

## Point System

Based on the official [Google Skills Arcade](https://go.cloudskillsboost.google/arcade) and [Arcade Fasilitator ID](https://rsvp.withgoogle.com/events/arcade-fasilitator-id/sistem-poin) pages:

| Item | Points |
|------|--------|
| 1 game badge (Adventure, Voyage, Trail, Base Camp, etc.) | 1 point each |
| 2 skill badges | 1 point |

Special games may have different point values (e.g. 2-3 points). The app reads point values from the official Arcade page when available.

### Tier thresholds

| Tier | Min Points | Total Spots |
|------|-----------|-------------|
| Arcade Trooper | 50 | 6,000 |
| Arcade Ranger | 75 | 4,000 |
| Arcade Champion | 95 | 3,000 |
| Arcade Legend | 120 | 2,500 |

> Tier spots refresh weekly. Spot counts shown in the app are snapshots from when the page was last checked.

---

## Notes

- The app depends on the public Google Skills profile page being accessible.
- The parser may need updates if Google changes the public profile HTML structure.
- Admin login is lightweight and browser-session based; it is designed for simple project administration, not high-security access control.
- No participant data is stored in a database. Check history stays in the browser where the check was performed.
- `.env` is git-ignored and will not be committed to the repository.
