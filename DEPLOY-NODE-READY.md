---
title: Node-ready deployment package
type: ops
status: active
owner: Prem
updated: 2026-10-14
summary: What the prebuilt Node deployment ZIP contains and how to run it.
tags: [area/deploy]
related: [DEPLOYMENT.md]
---
# Ready-to-run Node deployment bundle

The separate `prem-liquid-portfolio-deploy-node.zip` contains prebuilt site assets and generated API modules. It does not contain the authoring scripts or source catalog; use the source handoff ZIP to edit content or rebuild.

## Requirements

- Node.js 20.6 or newer
- A host that can run a long-lived Node process and provide environment variables
- HTTPS at the host or reverse proxy for microphone/camera permissions and production traffic

There are no npm dependencies to install. From the extracted folder, configure the host's environment variables and start the service:

```sh
npm start
```

For local testing, copy `.env.example` to `.env`, fill in provider keys, then run:

```sh
npm run start:local
```

The service listens on `0.0.0.0:3000` by default. Set `PORT` if the platform assigns a different port. The health endpoint is `/healthz`.

## Configure API providers

For live model answers set `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`. For ElevenLabs narration set `AI_VOICE_KEY` and optionally `AI_VOICE_ID`. See [API_CONNECTIONS.md](API_CONNECTIONS.md) for exact data flows, limits and key handling.

Use the receiving host's encrypted environment settings. Do not commit `.env`, add keys to the frontend, or place credentials in the deployment archive.

## Reverse proxies

When the Node service sits behind a trusted proxy, set `TRUST_PROXY=true`. Configure the proxy to overwrite `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-For`; the Node adapter uses these values for same-origin validation and per-IP rate limiting. Keep `TRUST_PROXY=false` for direct client connections.

## Rebuilds and updates

This bundle is a snapshot. To change content, theme, behavior, assistant knowledge or project media, use the source handoff ZIP, run `npm run build` and `npm run check`, then create a fresh deployment bundle.
