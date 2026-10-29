---
title: Project handoff
type: guide
status: active
owner: Prem
updated: 2026-10-29
summary: Architecture map, build and content workflow, open items and the transfer checklist.
tags: [area/docs, area/deploy]
related: [PROJECT_STATE.md, DEPLOYMENT.md]
---
# Project handoff

## Overview

This is a modular portfolio frontend and content framework, not a CMS-dependent export. Project records and profile sections are structured data; the browser renders them as cards, project details, galleries, timeline items, testimonials and assistant citations. The UI runs as native browser modules. The optional assistant and speech features are same-origin server routes.

## Architecture map

| Path | Responsibility |
| --- | --- |
| `dist/index.html` | Main document and bootstrapping markup |
| `dist/*.js`, `dist/*.css` | Browser modules, design tokens, layouts, navigation and motion |
| `dist/control-preferences.js`, `dist/control-style.js`, `dist/control-style.css` | Global and local control variants; see DESIGN_SYSTEM.md and ADR-012 |
| `dist/assets/` | Local project images and video |
| `dist/vendor/` | Bundled third-party assets and their notices |
| `content/catalog.json` | Editable content catalog, including projects, profile pages and reusable components |
| `dist/content/` | Content model, schemas, generated content exports and render helpers |
| `dist/assistant-knowledge.js` | Curated answer facts, phrase routes and suggested questions |
| `worker/` | Assistant and voice handlers; provider keys are read only from runtime environment |
| `deploy/node-server.mjs` | Node adapter that serves `dist/client/` and invokes the API handlers |
| `scripts/` | Content generation, Worker packaging, style generation and checks |
| `tests/` | Unit and integration coverage for content, interactions and API behavior |

## Build and content workflow

1. Edit the source record in `content/catalog.json`; do not edit generated content exports by hand.
2. Add or update media under `dist/assets/`, and point the catalog media entry to its local path or a deliberate external URL.
3. Run `npm run images` after adding or replacing any image (thumbnails and backdrop copies; see `MEDIA_ASSETS.md`). Then run `npm run build`. `scripts/build-content.mjs` validates and generates catalog indexes/schemas. `scripts/build-worker.mjs` copies browser files into `dist/client/` and creates `dist/server/` with published assistant documents and server modules.
4. Run `npm run check` before handoff or deployment.

The existing content model is CMS-agnostic: an eventual CMS or API can provide records that satisfy the schemas in `dist/content/`. The current source of truth remains the checked-in JSON catalog; no database is required.

## Request and data boundaries

- Public portfolio content and approved assistant facts are versioned with the project.
- Chat history is kept in browser `sessionStorage`; there is no conversation database in this package.
- Common curated questions can be answered without a model call. Other questions send the question, up to four recent messages and the published content corpus to the configured model provider.
- The provider API key and ElevenLabs key are server-side secrets only. The browser calls same-origin `/api/assistant` and `/api/voice` routes.
- Voice narration sends the answer text to ElevenLabs when the user plays or enables spoken answers. Dictation uses the browser's Speech Recognition API; processing behavior depends on the browser and operating system.
- Gesture tracking uses camera frames and the bundled MediaPipe runtime in the browser. Camera access requires HTTPS outside localhost. Do not describe browser speech recognition as guaranteed local processing.

## Runtime and scaling notes

- The assistant has no database or vector store. At the current catalog size, the Worker supplies the compact published records directly to the model.
- Per-session and per-IP rate limits are process/isolate-local maps. Multiple replicas each maintain their own counters; use shared storage if strict global limits are later required.
- The backend is stateless between requests. It does not save chat transcripts or provider responses.
- The API routes enforce same-origin checks and input-size limits. Keep them behind HTTPS and avoid logging request bodies.
- Project prototypes for Merlin, Tracr and Bastion are external URLs defined in `content/catalog.json`. They need to remain reachable and permit iframe embedding, or be replaced with new URLs.
- Local videos are large files; preserve HTTP byte-range support on hosts so browser video playback can seek efficiently. The included Node adapter supports range requests.

## Open items (as of 2026-10-26)

The live list is in [TASKS.md](TASKS.md) and [PROJECT_STATE.md](PROJECT_STATE.md); this section is a snapshot for people who start here.

- **Preset fixture drift (TASK-034).** settings-transfer/site-settings assume removed legacy style fields; the current profile has explicit controlStyle/cardGlassStyle values. The Mascott appearance/preset browser checks pass.
- **Failing tests.** Six tests assert catalog contents that have since changed (`content-model`, `home-about`, `home-layout`, `home-sections`, `interaction-commands`, `project-media-focus`). `project-entry-memory` (card-sphere code reads `document` in a Node sandbox) and `text-list-hover` (a Porter fixture assertion) relate to in-progress card-sphere work. `masonry-placement` fails because Bastion is now a portrait card and also featured, which breaks the rule that portrait cards sit in the right-hand columns of a 3+ column grid.
- **Navigation at the top.** The dock's attached menus still open upward, so the site index menu is mostly off screen; see `FRAMEWORK.md`.
- **Bastion media.** `bastion.mp4` (portrait) is about 31MB against roughly 2MB for the other videos. `catalog2.json` still points Bastion at the landscape `bastion2.mp4`.
- **Hidden controls.** The composer's attach button is hidden, not removed; see `FRAMEWORK.md`. The Lab is the in-app route `#lab` (four-column cards, ripple transition; ADR-011); `lab.html` only redirects.
- **Duplicate docs.** The parent folder holds older copies of `README.md` and `DEPLOYMENT.md` that differ from the ones in `portfolio2026/`. The `portfolio2026/` copies are current.

## Handoff checklist

- [ ] Transfer this ZIP and confirm the recipient has Node.js 20.6+.
- [ ] Set `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` in the new host's secret manager if chat should use live model answers.
- [ ] Set `AI_VOICE_KEY` and the chosen `AI_VOICE_ID` if ElevenLabs narration is wanted.
- [ ] Confirm billing, quota and allowed model/voice access with the provider accounts.
- [ ] Build and run `npm run check` on the target environment.
- [ ] Deploy behind HTTPS; configure same-origin `/api/*` routing if static files and the API use separate services.
- [ ] Test a curated answer, a model-generated answer, voice playback, prototype embeds, video seeking and mobile layout.
- [ ] Keep secrets out of Git, archives, browser bundles, logs and support screenshots.

## Platform-specific material intentionally omitted

The archive does not include `.git/`, the original Sites project identifier, any deployment credential, API key, `.env` file, or provider account settings. Those values belong to the receiving deployment and must be provisioned there.
