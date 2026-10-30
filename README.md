# VibeTube — responsive video-sharing platform

A monorepo foundation for a mobile-friendly video-sharing website.

## Included features

- Responsive Next.js homepage with VibeTube branding and supplied peach logo
- Search and category filtering on the homepage
- Account registration and login with HttpOnly sessions and password hashing
- Sitewide 18+ age-confirmation gate protecting pages and API content
- Creator Studio for publishing videos and video watch pages
- Express API with health, auth, video, comment, like and subscription endpoints
- PostgreSQL + Prisma data model for users, videos, comments, likes, subscriptions,
  watch history, playlists, notifications and reports
- Cloudflare R2 direct uploads, plus development-only local video storage when R2 is not configured
- Docker Compose for local PostgreSQL and Redis

**Important:** This is an early MVP, not a production-ready video platform. Production
use still needs security hardening, abuse prevention, moderation workflows and operational
monitoring. Do not publish secrets or expose an admin account.
The age gate is self-declared; it blocks access until confirmation but does not verify a
person's identity or date of birth.

## Requirements

- Node.js 20.19+ (Node.js 22 LTS recommended; required by Prisma 7)
- npm 10+
- Docker Desktop (for local PostgreSQL/Redis)

## 1. Install

```bash
# From the vibetube directory
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
cp .env.example apps/api/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
```

The API reads `apps/api/.env`. The Next.js server reads root `.env` for
`API_INTERNAL_URL`, which points its `/api/*` rewrite to the Express API. Keep the
API database credentials and JWT secret in `apps/api/.env`, not the frontend env file.
For local development on port 3001, keep both `http://localhost:3000` and
`http://localhost:3001` in the API's comma-separated `WEB_ORIGIN` value.

When R2 variables are absent in development, uploads are saved under
`apps/api/.local-uploads/` so local upload and playback can be tested without a cloud
bucket. This folder is ignored by Git. Production requires the R2 settings and a public
playback URL; see [DEPLOY_FREE.md](./DEPLOY_FREE.md).

## 3. Start PostgreSQL and Redis

```bash
docker compose up -d
```

## 4. Create database tables

```bash
npm run db:generate
npm run db:push
```

`db:push` is convenient for local development. Use reviewed Prisma migrations
for shared and production environments.

## 5. Start both applications

```bash
npm run dev
```

- Website: http://localhost:3000
- API health: http://localhost:4000/api/health
- API videos: http://localhost:4000/api/videos

If port 3000 is occupied, Next.js may use another port; open the URL printed in its
terminal. The API's default port is 4000. Restart the API after changing `apps/api/.env`.

You can also run them separately:

```bash
npm run dev:web
npm run dev:api
```

## Project structure

```text
vibetube/
├── apps/
│   ├── web/                 # Next.js responsive website
│   │   ├── public/
│   │   │   └── vibetube-logo.jpg
│   │   └── src/app/
│   │       ├── watch/[id]/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── globals.css
│   └── api/                 # Express API
│       ├── prisma/schema.prisma
│       └── src/
│           ├── lib/prisma.ts
│           ├── routes/videos.ts
│           └── index.ts
├── docker-compose.yml
├── .env.example
└── package.json
```

## Production hardening still needed

Before a public launch, add and review email verification, password reset, login rate
limiting, CSRF protections, abuse reporting, moderation and production monitoring.
Review provider quotas and policies before enabling paid services.

## Brand asset

The supplied peach illustration is copied to `apps/web/public/vibetube-logo.jpg`.
Replace it with a transparent PNG/SVG later if you obtain a clean transparent version.


## Free-tier live deployment

See [DEPLOY_FREE.md](./DEPLOY_FREE.md) for the Vercel + Render + Neon + Cloudflare R2 deployment walkthrough and provider limits.
