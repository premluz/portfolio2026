# Prem — liquid portfolio

A buildless, modular portfolio site for Prem Luczak. The browser interface is authored as native HTML, CSS and ES modules. Structured portfolio content is stored separately from the presentation layer, and a small API worker powers grounded assistant answers and optional ElevenLabs speech.

This handoff contains the source, media, tests, documentation and a portable Node server adapter. It contains **no provider credentials** and does not depend on the original Sites project to run.

## Quick start

Requirements: Node.js 20.6 or newer. There are no third-party npm runtime or build dependencies.

```sh
cp .env.example .env
# Put provider keys in .env for local development only.
npm run build
npm run check
npm run start:local
```

Open `http://localhost:3000`. The assistant falls back to authored answers if the model API is not configured. Speech playback is disabled until `AI_VOICE_KEY` is configured.

For production, configure variables in the hosting provider's secret manager, then run `npm run build` during deployment and `npm start` as the service command. Do not upload a populated `.env` file or commit provider keys.

## What is included

- `dist/` — site HTML, CSS, JavaScript modules, project media and bundled vendor assets.
- `content/catalog.json` — editable source of truth for projects, profile sections and reusable content blocks.
- `worker/` — same-origin assistant and speech API handlers.
- `deploy/node-server.mjs` — dependency-free Node server for static files and API routes.
- `scripts/` and `tests/` — content/build scripts and automated checks.
- `ASSISTANT.md`, `API_CONNECTIONS.md`, `CONTENT_MODEL.md`, `DESIGN_SYSTEM.md`, `FRAMEWORK.md`, `INTERACTIONS.md`, `HANDOFF.md`, and `DEPLOYMENT.md` — implementation and operations documentation.

## Dependencies

| Area | Dependency |
| --- | --- |
| Browser UI | Modern browser with ES modules, CSS Grid, Fetch and Web APIs; no npm packages |
| Build/check scripts | Node.js built-ins only |
| Self-hosted server | Node.js 20.6+ built-ins only |
| Assistant text | Optional OpenAI-compatible Chat Completions API credentials |
| Answer narration | Optional ElevenLabs Text to Speech API key |
| Dictation | Browser Speech Recognition API when supported by the browser |
| Gestures | Camera permission and MediaPipe assets bundled under `dist/vendor/` |

## Documentation

- Start with [HANDOFF.md](HANDOFF.md) for the architecture and transfer checklist.
- Use [DEPLOYMENT.md](DEPLOYMENT.md) for Node, static-host and Worker deployment steps.
- Use [DEPLOY-NODE-READY.md](DEPLOY-NODE-READY.md) for the prebuilt Node deployment ZIP.
- Use [API_CONNECTIONS.md](API_CONNECTIONS.md) for provider flows, variables and data handling.
- See [CONTENT_MODEL.md](CONTENT_MODEL.md) for the content schema and authoring workflow.
- Use [MEDIA_ASSETS.md](MEDIA_ASSETS.md) when replacing project images/videos or changing their orientation.
- See [ASSISTANT.md](ASSISTANT.md) for assistant behavior and curated knowledge.
- See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [FRAMEWORK.md](FRAMEWORK.md), and [INTERACTIONS.md](INTERACTIONS.md) for the UI system.

## Common commands

```sh
npm run build   # refresh generated content and Node/Worker output
npm run check   # generated-content validation and test suite
npm start       # run with environment variables already set by the host
```

The download package intentionally excludes `.git/`, the Sites-specific `.openai/` project identity, generated duplicate `dist/client/`, local `.env` files and any credentials. `npm run build` regenerates the deployment output.
