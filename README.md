# Google Skills Arcade 2026 Tier Calculator

A simple web calculator for Google Skills Arcade 2026 participants. Users can paste their public Google Skills profile URL, and the app checks which official Arcade games and skill badges are visible on the profile, calculates Arcade Points, and shows the current prize tier.

Created by [Ilham Arief](https://github.com/ilhamarief0).  
Project repository: [tracker-arcade-2026](https://github.com/ilhamarief0/tracker-arcade-2026)

## Features

- Public profile URL checker for Google Skills / Cloud Skills Boost profiles.
- Official Arcade 2026 tier calculator:
  - Arcade Trooper: 50 points
  - Arcade Ranger: 75 points
  - Arcade Champion: 95 points
  - Arcade Legend: 120 points
- Official-only counting logic:
  - Official Arcade game badges count by their listed points.
  - 2 official skill badges = 1 Arcade Point.
  - Generic unrelated badges are not counted toward Arcade tier progress.
- Official lab list with direct links to Arcade games and skill badge courses.
- English and Indonesian language selector.
- Admin login for developer-only tools:
  - Check history is visible only after admin login.
  - Admin can refresh the official Arcade game / skill list from the official page.
- No database required; history, admin session, language, and refreshed resources are stored in browser `localStorage`.

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- Cheerio
- Oxlint

## How It Works

The frontend sends a profile URL to the local Express API:

```txt
POST /api/check-profile
```

The backend fetches the public profile HTML, parses visible badge titles, matches them against the official Arcade 2026 game and skill badge list, and returns:

- matched official games
- matched official skill badges
- Arcade Points
- detected tier

The admin refresh action calls:

```txt
GET /api/official-arcade
```

This endpoint is protected with an admin token and fetches the latest official Arcade page data.

## Admin Login

Default local credentials:

```txt
Username: developer
Password: 
```

The password is not stored in the frontend. Login is validated by the backend using a SHA-256 hash.

For production, set these environment variables instead of relying on defaults:

```bash
ADMIN_USERNAME=developer
ADMIN_PASSWORD_HASH=<sha256-password-hash>
ADMIN_TOKEN=<long-random-token>
```

Generate a password hash with Node.js:

```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('your-password').digest('hex'))"
```

Generate a random token:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the Vite dev server with the Express API middleware:

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

During development, `vite.config.js` mounts the Express API router automatically, so `/api/check-profile`, `/api/admin-login`, and `/api/official-arcade` are available from the same dev server.

## Local Production Build

Build the app:

```bash
npm run build
```

Start the production Express server:

```bash
npm start
```

Open:

```txt
http://localhost:4174
```

You can override the port:

```bash
PORT=3000 npm start
```

## Preview Static Build Only

Vite preview serves only the built frontend:

```bash
npm run preview
```

Use this only to preview UI assets. The profile checker API is not served by `vite preview`; use `npm start` for the full app.

## Linting

Run Oxlint:

```bash
npm run lint
```

## Deployment

### Option 1: Node Hosting / VPS / Railway / Render / Fly.io

This is the recommended deployment style for full functionality because the project uses an Express backend.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Required environment variables for production admin auth:

```bash
ADMIN_USERNAME=developer
ADMIN_PASSWORD_HASH=<sha256-password-hash>
ADMIN_TOKEN=<long-random-token>
PORT=4174
```

If your platform injects its own `PORT`, you do not need to set `PORT` manually.

### Option 2: Vercel Static Deployment

You can deploy the frontend to Vercel as a static Vite app:

```bash
npm install -g vercel
vercel
```

Use these settings:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Important: a static Vercel deployment will serve the UI, but the Express API in `server/profile-checker.js` will not run automatically as a Vercel Serverless Function. Without adapting the API, profile checking, admin login, and refresh features will not work on Vercel static hosting.

To use full functionality on Vercel, convert the Express routes into Vercel API routes under an `api/` directory or deploy the backend separately and point the frontend requests to that backend.

### Option 3: Split Frontend and Backend

You can deploy:

- Frontend on Vercel / Netlify / Cloudflare Pages.
- Backend Express server on Railway / Render / Fly.io / VPS.

Then update the frontend API calls in `src/App.tsx` from relative paths such as:

```ts
fetch('/api/check-profile')
```

to your backend URL:

```ts
fetch('https://your-backend.example.com/api/check-profile')
```

If deploying this way, configure CORS on the Express backend before production use.

## Project Scripts

```bash
npm run dev      # Start Vite dev server with API middleware
npm run build    # Type-check and build frontend
npm run lint     # Run Oxlint
npm run server   # Start API server only
npm start        # Start production Express server and serve dist
npm run preview  # Preview static Vite build only
```

## Notes

- The app depends on the public Google Skills profile page being accessible.
- The parser may need updates if Google changes the public profile HTML structure.
- Admin login is lightweight and browser-session based; it is designed for simple project administration, not high-security access control.
- No participant data is stored in a database. Check history stays in the browser where the check was performed.
