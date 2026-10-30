# VibeTube — Free-tier deployment guide

This project is prepared for a no-custom-domain preview using:
- Render Free Web Service for Next.js
- Render Free Web Service for Express API (cold starts and ephemeral local disk)
- Neon Free for PostgreSQL
- Cloudflare R2 free monthly allowance for video object storage

## Important free-tier constraints

- Render Free services sleep after 15 minutes idle and can take around one minute to wake up. They have ephemeral disks; all user videos must be stored in R2, never on the Render filesystem.
- Render says Free instances are for previews and hobby projects, not production applications. Use paid instances for a production launch.
- Neon free databases scale to zero and have storage/compute/network quotas.
- R2's free monthly allowance currently includes 10 GB-month standard storage, 1 million Class A operations and 10 million Class B operations, with no egress charge. Usage beyond the free allowance is billable if billing is enabled.
- This project stores original MP4/WebM/MOV files and uses browser playback. It does not transcode videos, generate HLS renditions or provide DRM. Large videos and many viewers will exceed a hobby setup's practical capacity.
- The current 18+ gate is a self-declaration, not proof of age or identity. Use a compliant age-verification provider if your jurisdiction or content requires stronger checks.
- Free tiers and policies change. Review provider limits before publishing.

## A. Create Neon PostgreSQL

1. Create a Neon account and a project.
2. Copy the pooled or direct PostgreSQL connection string.
3. Ensure it includes `sslmode=require`.
4. Keep the string private.

## B. Create Cloudflare R2 bucket

1. Create a Cloudflare account and open R2.
2. Create a Standard storage bucket named `vibetube-media`.
3. Create an R2 API token with Object Read & Write for this bucket.
4. Copy Account ID, Access Key ID and Secret Access Key.
5. For public playback, connect a public custom domain (requires owning a domain) or enable the R2.dev public development URL if offered for your account/bucket. Copy the public base URL into `R2_PUBLIC_BASE_URL`.
6. Configure bucket CORS to allow `PUT` from your Render frontend URL and the local frontend origin (`http://localhost:3000` by default, or `http://localhost:3001` if you start it on port 3001), allow header `Content-Type`, and expose `ETag`.
7. Never place R2 secret keys in the frontend. They belong only in the API environment.

Example R2 CORS policy (replace origins with your actual origins):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001", "https://YOUR-FRONTEND.onrender.com"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## C. Deploy the API and frontend to Render

1. Push this project to a GitHub repository.
2. In Render, create a new Blueprint and connect the repository; Render reads `render.yaml` and defines both services in Singapore.
3. Set the API environment variables:
   - `DATABASE_URL`: Neon pooled connection string for app traffic
   - `WEB_ORIGIN`: exact `https://YOUR-FRONTEND.onrender.com` URL Render assigns
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`
   - `JWT_SECRET`: use a unique random value of 32+ characters
4. Set the frontend environment variable `API_INTERNAL_URL` to the exact public API URL, such as `https://vibetube-api.onrender.com`.
5. Deploy both services. Check `https://YOUR-API.onrender.com/api/health` and open the frontend service URL.
6. Add the exact frontend URL to the R2 bucket CORS `AllowedOrigins`.

## D. Prisma schema

The Neon `production` branch schema has already been synchronized. For future schema changes, use a direct Neon connection string locally:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

For a production team workflow, use reviewed migrations (`prisma migrate deploy`) rather than relying on `db push` for schema changes.

## E. Verify

- Open the Render frontend URL.
- Register an account.
- Open Creator Studio.
- Upload a small MP4.
- Confirm the video object exists in R2.
- Open the published video and verify playback.
- Test likes and comments while signed in.

## Before calling it production-ready

This is a functional early MVP, not a fully hardened public platform. Add and test:
- Email verification and password reset
- A shared rate-limit store before running multiple API instances. The current limits (10 failed sign-ins per 15 minutes and 5 registrations per hour per IP) use in-process memory and reset when the process restarts.
- CSRF protection, abuse prevention, moderation and reporting
- Upload cleanup, quota enforcement, signed playback/private videos
- Accurate deduplicated views and watch-time analytics
- Video transcoding/HLS and thumbnails
- Backups, restore tests, monitoring and security review
- Terms, privacy policy, copyright/takedown and community guidelines

Never commit `.env` files or publish API secrets. Do not send credentials in chat.
