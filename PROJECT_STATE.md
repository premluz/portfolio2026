---
title: Project state
type: state
status: active
owner: Prem
updated: 2026-10-29
summary: Where the project is right now: what runs, what is switched on, what is failing, open questions and the next action. How I work content is consolidated in its independent component.
tags: [area/docs, kind/process]
related: [TASKS.md, PROGRESS.md, HANDOFF.md]
---
# Project state

Snapshot of 2026-10-29. The control-variant work is uncommitted alongside pre-existing owner changes; preserve the full dirty worktree. Ghost, Outline and Glass now share one global setting with local overrides and independent card glass (ADR-012). Refresh this file whenever the picture or the next action changes.

## What this is

A buildless native-module portfolio for Prem Luczak: authored HTML, CSS and ES modules in `dist/`, structured content in `content/catalog*.json`, a small API worker for assistant answers and speech. Architecture is in [HANDOFF.md](HANDOFF.md) and [FRAMEWORK.md](FRAMEWORK.md).

## How to run it

- `npm run dev` serves `dist/` and the catalog directly; save and reload. Add `?dev=1` to the address to show the developer settings.
- `npm start` (port 3000) serves the built `dist/client/` copy; run `npm run build` first or it shows old content.
- For an isolated test server use another port: `PORT=3417 HOST=127.0.0.1 node deploy/node-server.mjs --dev`.

## What is switched on

| Option (developer settings) | Default | Notes |
| --- | --- | --- |
| Featured stage (Layout) | off | One project per row with a full-viewport backdrop |
| Project backdrop image (Project details) | off | Backdrop behind detail pages |
| Show footer (Content) | on | Hides the site footer on every route |
| Hero heading h1 (Content Home) | on | Current layout only; Flip and Flat keep it |
| Available badge (Content Home) | on | The hero status pill; switch it off there |
| Strapline, At a glance (Content Home) | off | Hero additions |
| Card details, Client above (Cards) | off | Status pill, gradient results and tag row; client on top in wide tracking |
| Plain cards (Cards) | off | Removes skin, reflections, edge glow and note-card panels |
| Control style (Design → Controls) | Glass | Ghost / Outline / Glass, with local Inherit overrides; the legacy published profile migrates to Ghost |
| Glass cards (Design system) | on | Independent of control styling |
| Navigation position | bottom | Top is a preview; see TASK-002 |
| Ambient colour | automatic | Glow strength 100% |
| Text size | Medium | Headings and body scale separately (ADR-006) |
| Composer attach button | hidden | In the code, not removed |
| Lab (dock, site menu) | visible | In-app route `#lab`: four-column grid of the home cards, ripple transition (ADR-011) |

## Tests

TASK-035: Mascott Speed controls travel pace from 25–300% (100% default), updates an active path without jumping, and persists/round-trips with presets. Build, focused motion/engine tests and all six browser checks pass (three startup/material timeouts passed on isolated rerun).

TASK-033: Developer settings → Mascott follows Motion. Six appearance dropdowns update/save the real renderer and travel with presets; startup configuration is applied before the first render, including while hidden. Build, five focused Node checks and sixteen distinct browser checks pass.

TASK-031/TASK-032 mascot integration is complete locally: WebGL retains the PNG fallback and now shares drag glow/deformation during container travel. All 175 package tests, package typing/source checks and builds, folio build, four existing agent/assistant checks and ten focused browser checks pass. Existing visibility/motion settings remain authoritative; the shipped profile has Show mascot off. Remote deployment is outside scope.

The current full check stops at the existing About section-order assertion (`tests/about-page.mjs:34`). The control-system build, thirteen focused unit checks and five browser checks pass (TASK-021).

Known failing checks are tracked by task. Run one with `node tests/<name>.mjs`.

- Preset fixture drift (TASK-034): settings-transfer and site-settings still assume legacy style fields removed from the current exported profile.
- Content drift (TASK-004): content-model, home-about, home-layout, home-sections, interaction-commands, project-media-focus.
- Card-sphere work in progress (TASK-005): project-entry-memory, text-list-hover.

`npm run check` stops at the first failing test, so use the loop in [AGENTS.md](AGENTS.md) to see them all.

## Questions

None open. The owner answered these on 2026-10-26.

### Q-001 Should the project status (Launched, Building, R&D) be shown on cards and detail pages?
- Status: answered
- Tags: area/home, area/content

Yes, as a pill above the client, through Card details on cards ([ADR-008](docs/decisions/ADR-008-card-detail-copy-is-opt-in-and-stacked.md), REQ-015). Not yet on detail pages.

### Q-002 Where and when should the Lab page be linked?
- Status: answered
- Tags: area/lab

Linked from the dock and the site menu since 2026-10-27, as the in-app route `#lab`: a four-column grid of the same cards, entered through the ripple (REQ-006, ADR-011).

### Q-003 Should the Available badge move next to the name in the header?
- Status: answered
- Tags: area/home

No. It stays above the hero heading.

## Next action

Run `npm run memory:next`. On 2026-10-26 it listed TASK-001, TASK-002, TASK-003, TASK-004, TASK-006, TASK-007; TASK-005 is blocked. The memory MCP server is not used: the owner maintains Markdown memory only. The deploy-critical work (committed image copies and content exports) is done.
