
# Social Calendar — Netlify Functions + Supabase

This project is set up to run the frontend on Netlify and backend as Netlify Functions.
Data is stored in Supabase (Postgres). Reminder emails are sent via SMTP (configured as env vars).

## Quick overview

- Frontend: `frontend/` (Vite + React). It calls serverless functions at `/.netlify/functions/*`.
- Serverless functions: `netlify/functions/` — each file becomes an endpoint.
- Supabase: use the provided SQL to create the required tables.
- Env vars (set in Netlify site settings):
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY  (used ONLY by functions; do NOT expose to browser)
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_USER
  - SMTP_PASS
  - FROM_EMAIL

## Local dev
Install Netlify CLI: `npm i -g netlify-cli`
Run `netlify dev` at project root to serve frontend and functions locally (it will read Netlify dev env vars).

## Deploy
1. Push to GitHub.
2. Connect the repo to Netlify.
3. Add the Environment variables listed above in Site settings.
4. Deploy.

See `supabase/init.sql` for the database schema you should run in your Supabase SQL editor.
