---
title: Progress log
type: log
status: active
owner: Prem
updated: 2026-10-26
summary: Append-only record of meaningful work, what was verified, and what is left, newest first.
tags: [area/docs, kind/process]
related: [TASKS.md, PROJECT_STATE.md]
---
# Progress log

Newest first. Add an entry after meaningful work: what changed, the evidence, and any risk left. Do not rewrite old entries; correct them with a new one.

## 2026-10-26 Memory is maintained as Markdown only
The owner decided not to register the memory MCP server; memory is kept current by updating TASKS, PROGRESS, PROJECT_STATE and the docs after meaningful work (the habit in AGENTS.md). TASK-012 was dropped. The server and its test stay in the repository, unregistered.

## 2026-10-26 Memory MCP server and commits
Built a read-only project memory MCP server (`scripts/memory-mcp.mjs`, four tools, no dependency, not registered; ADR-007, TASK-009). Committed the work as 83dbce2 (memory structure), 17fc2ba (image checks) and 1ee57a1 (regenerated content exports), leaving the owner's `agent*` feature uncommitted (TASK-008). Evidence: tests/memory-mcp.mjs passes, including a real stdio session; a clean worktree of HEAD passes `build-content --check`, `check-images` and `memory check`. The clean-worktree check caught that `dist/content/` exports had not been committed with the catalog change, which the third commit fixed. Left: registering the server with a client (TASK-012).

## 2026-10-26 Project memory structure
Added AGENTS.md, CLAUDE.md, PROJECT_STATE.md, this log, TASKS.md and docs/ (constitution, requirements, facts, six decisions), plus `scripts/memory*.mjs` to index, search and validate them. Evidence: `node scripts/memory.mjs check` and tests/project-memory.mjs pass (TASK-010). Left: an MCP interface is proposed only, not installed (TASK-009).

## 2026-10-26 Image pipeline and freshness check
`npm run images` runs the thumbnail and backdrop generators; each records the original's SHA-1, and `npm run check:images` (run first by build and check) fails on any mismatch. Evidence: tests/image-freshness.mjs passes; a changed original made the build stop with exit 1 (TASK-011, ADR-001). Found along the way: Bastion's card orientation typo (`portraitwh`) was blocking the whole content build (FACT-006), a misspelled backdrop filename did the same, and `catalog2.json` pointed at renamed files. Risk: the generated copies and `dist/assets/backgrounds/` are uncommitted (TASK-008).

## 2026-10-26 Home hero, type scale and header
Header logo is the About portrait as a round avatar with the name beside it. Added the Strapline and At a glance sections (off by default, ADR-005), a shared hero spacing token, the Navigation position setting, the split heading/body type scale and the mono text role (ADR-006). Evidence: computed sizes and gaps measured in a browser (REQ-009); tests/content-widths.mjs updated for the new section keys. Left: Top navigation menus open upward (TASK-002).

## 2026-10-26 Backdrops, featured stage and reveal
Per-project backdrops linked by asset id with a generic fallback (ADR-002), a Featured stage layout and a Project backdrop image setting, and a timed reveal as each stage scrolls in (ADR-003). All nine home projects are featured. Evidence: tests/project-backdrop.mjs passes; stage geometry and reveal replay measured in a browser at 1440×900 (REQ-002 to REQ-005). Left: Porter has no backdrop yet (TASK-007); Bastion became portrait, which breaks tests/masonry-placement.mjs (TASK-001).

## 2026-10-26 Simple-transition image return
Home images were requested again after a simple transition and appeared after the fade-in. `MediaLoader` now holds one `Image` per loaded URL. Evidence: tests/media-loading.mjs passes with a new case; all images ready with no requests under simulated latency (REQ-012, FACT-007).

## 2026-10-25 Dock, project status and navigation fixes
Fixed a sliver drawn across the dock during Back (the back-pill splice matched the right edge's text when the pill width ended in 0), with a regression test (REQ-010). Dock outside composer mode now uses the Assistant button's glass. Added a required `projectStatus` (Launched, Building, R&D) to every project (REQ-013). Lab links and the composer's attach button were hidden, not removed.

## 2026-10-24 Lab page and ambient glow
Added `lab.html` with a single colour-split ripple transition (ADR-004, REQ-006). Ambient glow gained an automatic colour mode that samples the card media, a per-project manual override, a strength slider, and a rise from below the viewport (REQ-007). Evidence: ripple measured in a browser through both page changes; glow colours measured per project and mode.
