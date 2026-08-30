# Cycling Lumpiness Index v3.0 — Strava-enabled build

This build keeps the canonical CLI v3.0 calculation unchanged and adds optional Strava import.

## Why this build is not GitHub Pages-only

Strava OAuth requires a client secret. A client secret must never be placed in `index.html`, so the Strava-enabled
version needs a small server-side component. This package is ready for **Netlify**, which can host the existing
static page and the included serverless functions on the same domain.

Your GitHub repository can remain the source repository; Netlify can deploy directly from it.

## Strava setup

1. Create/manage your Strava API application at https://www.strava.com/settings/api
2. Deploy this repository to Netlify.
3. In the Strava API application settings, set **Authorization Callback Domain** to your Netlify hostname
   (for example `your-site.netlify.app` — hostname only, no `https://` or path).
4. In Netlify → Site configuration → Environment variables, add:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `SESSION_SECRET` (a long random value, preferably 32+ random bytes)
5. Redeploy the site.

The callback URL is generated automatically as:
`https://YOUR-SITE/.netlify/functions/strava-callback`

## What the integration does

- OAuth scope requested: `read,activity:read_all`
- Lists the authenticated rider's 50 most recent activities.
- Shows cycling activities in the selector.
- For a selected activity, requests only `distance`, `altitude` and `time` streams.
- Reconstructs the elevation profile in-browser and applies the same canonical 25 m CLI v3.0 processing.
- Access/refresh tokens are stored in an encrypted, HTTP-only same-site cookie.
- Access tokens are refreshed server-side when needed.
- Disconnect attempts Strava's current OAuth revocation endpoint and clears the local session.

## GPX vs Strava values

A Strava-imported activity can differ slightly from a GPX calculation if Strava's stored altitude stream differs
from the elevation values in the exported GPX. This is an input-data difference, not a different CLI formula.

## Local development

Netlify CLI can be used for local testing:

`npx netlify dev`

Configure the three environment variables locally before authenticating with Strava.

## Existing GitHub Pages site

The non-Strava GPX-only version can remain on GitHub Pages. To make Strava authentication work reliably,
deploy this Strava-enabled build to Netlify (or another host with same-origin serverless functions).
