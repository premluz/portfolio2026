---
title: Deployment
type: ops
status: active
owner: Prem
updated: 2026-10-22
summary: Node, static-host and Worker deployment steps.
tags: [area/deploy]
---
# Deployment guide

## 1. Prepare the project

Install Node.js 20.6 or newer. The site does not need a package install: `package.json` defines scripts but no third-party dependencies.

```sh
npm run build
npm run check
```

Build creates `dist/client/` for static assets and `dist/server/` for the generated API worker modules and published content bundle. Keep these generated directories in the deployment output; the source download omits duplicate generated files to reduce its size.

## 2. Self-host on Node.js

The included `deploy/node-server.mjs` serves the static site and runs both API routes in one Node process. It uses only Node built-ins.

Local development:

```sh
cp .env.example .env
# Edit .env and enter API keys only on your local machine.
npm run dev:local
```

No build is required locally. Save source/catalog/settings edits and reload the
browser. Use `npm run dev` when local API credentials are not needed. Production
still serves the generated build through `npm start`.

Production host:

1. Set environment variables in the service dashboard/secret manager.
2. Set the build command to `npm run build`.
3. Set the start command to `npm start`.
4. Set `PORT` if the platform requires a specific port. The server binds to `0.0.0.0` by default.
5. Terminate TLS at the platform or reverse proxy. For a trusted reverse proxy, set `TRUST_PROXY=true` and have it overwrite/normalize `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-For`. Leave it false when clients connect directly. The forwarded client IP is used for the in-memory IP rate limits.
6. Route the site's domain to this service and verify `/healthz`, `/`, `/api/assistant` and `/api/voice`.

The Node server supports byte-range requests for video files, standard GET/HEAD requests for static assets, and a `/healthz` endpoint. Do not place untrusted content under `dist/client/`.

## 3. Static host plus separate API service

### Vercel

Use `npm run build` and the configured `dist/client` output directory. The root
`api/assistant.js` and `api/voice.js` entry points run the shared handlers as
Node.js Vercel Functions. Their request adapter maps Vercel's client IP header
to the core rate limiter, and voice responses stream directly to the browser.

Set `AI_API_KEY` (or `OPENAI_API_KEY`) and `AI_VOICE_KEY` in the project's
Production environment variables. The Vercel adapter defaults
`AI_API_BASE_URL` to `https://api.openai.com/v1` and `AI_MODEL` to `gpt-6-luna`;
explicit environment variables override those values. `AI_VOICE_ID` overrides
the shared voice handler's default. Redeploy after changing variables.

#### Content sets (dev panel)

Every `content/catalog*.json` is built into the deploy as a content set; all
share the same media. `api/site-config.js` records which set is live, and the
dev panel (`?dev=1` → Content) switches it for every visitor without a
redeploy. A write can only name a set that shipped; nothing is uploaded or
deleted. The choice lives in Vercel Global Config:

1. In the Vercel dashboard, create a Global Config store (Storage) and connect it
   to the project. Connecting adds a `GLOBAL_CONFIG` connection string holding the
   store ID and a read token (`GLOBAL_CONFIG_ID` and `GLOBAL_CONFIG_READ_TOKEN`
   can be set explicitly instead).
2. Create a Vercel REST API token that can update that Global Config and set it
   as `VERCEL_API_TOKEN`, plus `VERCEL_TEAM_ID` when the project belongs to a team.
3. Redeploy.

#### Publishing settings (dev panel)

With `?dev=1`, the developer settings panel has **Publish to this site** and
**Use built-in**. Settings change live in your own browser as you edit them.
Publish saves the same profile that Export produces on the server, so every
visitor of this domain gets it on their next page load (within about a minute,
because answers are cached for a few seconds) without a deploy. Use built-in
removes the published profile, and the newest export in `settings/` applies
again. The server checks structure and size; every browser re-checks each value
against its controls and falls back to the built-in settings, logging an error,
if a published profile cannot be applied. Publishing changes settings only, not
content, media or code.

Several Vercel projects can serve this one codebase with different content.
Connect the same store to each and give each project its own `CONTENT_SET_KEY`
(for example `contentSet-main` and `contentSet-second`, up to 50 characters); the
default key is `contentSet`. Published settings are saved under the same key with
`-settings` added. Each project then keeps an independent choice, and deploys
ship the same code and every set.

Without them the site serves `catalog` and the picker is read-only. Locally,
`npm run dev` keeps the choice in memory. To add a set, create
`content/catalog2.json` (or `catalog-<name>.json`), rebuild and deploy once;
after that only the dropdown changes which set is served. Run
`node tests/site-config.mjs` to check the endpoint.

Run `node tests/vercel-api.mjs` to check both entry points, provider configuration,
signed playback, origin validation, bounded bodies and client IP normalization.

### Other static hosts

The browser expects same-origin paths `/api/assistant` and `/api/voice`. If static files and API run on separate services, configure the domain's reverse proxy to forward `/api/*` to the API service while keeping the browser URL same-origin. Set the API service's trusted-proxy mode correctly and preserve the public Host/protocol for origin checks.

Static files are generated under `dist/client/`. Use `dist/client/index.html` as the site entry and preserve the directory structure. Keep HTTP range support for `.mp4` files. Hash navigation means project routes do not require server-side HTML rewrites, though rewriting unknown paths to `index.html` is harmless.

Static hosting alone does not provide live model answers or ElevenLabs playback. If API routes are absent, the portfolio still renders, but assistant/voice features will show their fallback/unavailable states.

## 4. Worker-compatible hosts

The source Worker entry is `worker/index.js`. `npm run build` produces `dist/server/index.js` and `dist/client/`; the Worker expects the static asset binding to be named `ASSETS` and to serve files from `dist/client/`. Route `/api/*` through the Worker before static fallback. Add the provider variables listed in [API_CONNECTIONS.md](API_CONNECTIONS.md) to the host's encrypted environment settings.

For the original Sites host, `.openai/hosting.json` contains the project identity and is intentionally excluded from the portable ZIP. The receiving Sites project must have its own project metadata and secrets. For Cloudflare or another Worker host, attach the platform's static asset binding and set `ASSETS` to the documented binding name; do not copy the original Sites project ID.

## 5. Environment variables

| Name | Needed for | Secret? |
| --- | --- | --- |
| `AI_API_BASE_URL` | Live model answers | No |
| `AI_API_KEY` | Live model answers | **Yes** |
| `AI_MODEL` | Live model answers | No |
| `OPENAI_API_KEY` | Optional legacy alias for `AI_API_KEY` | **Yes** |
| `AI_VOICE_KEY` | ElevenLabs narration and token signing | **Yes** |
| `AI_VOICE_ID` | Selected ElevenLabs voice | No |
| `PORT` | Node server listening port | No |
| `TRUST_PROXY` | Enable trusted proxy headers in Node adapter | No |

For a new deployment, begin with `.env.example`. The example contains no keys.

## 6. Content and domain changes

- Edit projects and page sections in `content/catalog.json`.
- Edit assistant facts, exact-answer routes and suggested prompts in `dist/assistant-knowledge.js`.
- Update prototype iframe URLs and external links in the catalog if they change.
- Update the legal/contact links in the content or markup as appropriate.
- During development, use `npm run dev`, save edits and reload. Before deployment, rebuild and run checks. Do not edit generated `dist/client/` or `dist/server/` output directly.

## 7. Post-deploy verification

- Open the homepage and About page on desktop and mobile.
- Open a project, return with Escape/Go Back, and verify media and source navigation.
- Seek within a project video to verify range support.
- Test one curated assistant question without credentials.
- Test one model-backed question after configuring the model provider.
- Test narration only after configuring ElevenLabs.
- Check iframe prototypes and external links from the deployed domain.
- Inspect server logs for errors, but do not log request bodies, provider keys, transcripts or answer text.

## Rollback

Keep the prior deployment artifact or image. Revert the app source/content commit, rebuild, run `npm run check`, and redeploy. Provider credentials are independent of source rollback and should be rotated through the host's secret manager if exposed.
