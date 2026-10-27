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

## 2026-10-26 Phone carousel and spacing
On a 390px phone the home carousel card was 239px wide: the saved Carousel size (70%, the minimum) scaled the card down. At 600px and below the size is now floored at full width, margins shrink (48px to 32px) and the card gap halves (48px to 24px), and the hero and overview gaps tighten. Measured in a mobile viewport: card 239px to 358px wide, carousel 77px higher. tests/mobile-carousel.mjs added. Desktop is unchanged.

## 2026-10-26 At a glance type
Owner asked to move the At a glance columns off mono: the three titles (Recently, Experience, Writing) are now `.text-eyebrow` and the items are ordinary sentence-case body text. Assumed "just titles" meant the titles become eyebrows; items back to mono is a one-class revert. Measured in a browser.

## 2026-10-26 Note cards made subtler
Owner asked for less gap and super-subtle cards: the gap between note cards went from 24px to 12px (`--note-cards-gap`) and the fill from 4% to 1.5% of the text colour (`--note-card-fill`). Measured 14px gaps and the new fill in a browser.

## 2026-10-26 Footer switch
Added Settings → Content → Show footer (default on). The app re-showed the footer on every route change, so that line now follows the switch. Evidence: tests/footer-switch.mjs passes; in a browser the footer hid, stayed hidden through About and a project, survived a reload, and returned when switched back on.

## 2026-10-26 Freshness check made reliable
The image freshness module cache-busted its import of image-variants.js with `Date.now()` alone, so two reads in the same millisecond could return a stale module and tests/image-freshness.mjs failed intermittently (about 1 run in 3 under load). It now adds a counter; 25 of 25 runs pass. Found while running the full suite for the heading switch.

## 2026-10-26 Hero heading switch
Added a Content Home switch for the hero h1 (default on), applying to the Current layout only because Flip and Flat reuse the h1 for the active project. Evidence: tests/hero-heading-switch.mjs passes; in a browser the heading hid in Current and stayed in Flat and Flip, and the choice persisted across a reload. A first attempt failed in Flat because an `!important` hidden rule beat the override, fixed by exempting the heading in that rule.

## 2026-10-26 Available badge switch
Added a Content Home switch for the hero's Available badge, on by default so the live site is unchanged. Evidence: tests/badge.mjs extended and passing; in a browser it showed by default, hid when switched off and stayed hidden after a reload.

## 2026-10-26 Note cards under featured projects
Each project now has `homeCards` and `detailCards` (one shared card structure: media, optional title and description), validated and projected with resolved media; three placeholder home cards on each project's cover image render under every staged project, with the backdrop confined to the first row (ADR-009, REQ-016). Evidence: tests/note-cards.mjs passes; measured in a browser. Two lessons recorded: a stale dev server rejected the new schema (FACT-009), and an absolutely positioned grid child needs both row lines (FACT-010). Left: the detail page does not render `detailCards` yet (TASK-015) and the cards hold placeholders (TASK-016).

## 2026-10-26 Eyebrow text role
Added a global `.text-eyebrow` role (caption size, light weight, label tracking, eyebrow ink, uppercase) and used it for the detail-page fact labels and the card tag row, replacing the tags' mono styling. Evidence: computed label styles identical before and after in light and dark; tests/card-details.mjs extended. The request's last line was cut off, so any further uses are open.

## 2026-10-26 Card details layout
Questions Q-001 to Q-003 resolved by the owner (status shown on cards; Lab page not linked yet; Available badge stays). Added two Cards settings: **Client above the title** (wide-tracked capitals, wins over Inline) and **Card details** (status pill, gradient results line, discipline tag row), plus a `disciplines` field per project, a reusable `.text-gradient` class shared with the About page, and `card-details.css` (ADR-008). Evidence: tests/card-details.mjs passes; in a browser the copy stacks status, client, title, results, tags, defaults leave the layout unchanged, Above wins over Inline, and the About highlight still renders its gradient. Committed as c6eea1b, 93f19e3 and b91f2eb; a clean worktree of the first caught that it had committed only half of a tokens.css change and a mismatched site.css, fixed by the next two (FACT-008). Left: the discipline tags other than Tracr's are drafts (TASK-013); the status reads Launched where the mockup says Shipped.

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
