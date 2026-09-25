# CinderBurn MVP

India-first hiring marketplace frontend + Cloudflare Worker/D1 starter.

## Files
- `index.html` — full frontend UI
- `styles.css` — responsive dark premium styling
- `app.js` — search, tabs, filters, demo interactions
- `worker.js` — Cloudflare Worker API starter
- `schema.sql` — D1 schema for users, companies, jobs and keyword skills

## Local preview
Open `index.html` directly in a browser, or serve the folder with any static HTTP server.

## Cloudflare direction
Frontend: Cloudflare Pages
API: Cloudflare Workers
Database: Cloudflare D1
Files: Cloudflare R2 (resume/portfolio/company logo storage)

## Next production steps
1. Add real authentication.
2. Connect D1 via Wrangler.
3. Move the demo result data in `app.js` to `/api/jobs`, `/api/search`, `/api/users`, and `/api/companies`.
4. Add job posting and applications endpoints.
5. Add R2 signed uploads for resumes and portfolios.
6. Add moderation, rate limiting, email verification and reporting before public launch.
