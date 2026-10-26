---
title: Tasks
type: tasks
status: active
owner: Prem
updated: 2026-10-26
summary: The only place task status lives; open work, blockers and completed work with evidence.
tags: [area/docs, kind/process]
related: [PROJECT_STATE.md, PROGRESS.md]
---
# Tasks

Statuses: `todo`, `in-progress`, `blocked`, `done`, `dropped`. A task is `done` only with `Evidence`. Run `npm run memory:next` for the open tasks that are ready, and `npm run memory:task -- TASK-nnn` for one task with its context.

## Open

### TASK-001 Fix placement of featured portrait cards in 3+ column grids
- Status: todo
- Tags: area/home, kind/bug
- Acceptance: tests/masonry-placement.mjs passes against the live catalog. A featured card spans two columns, but the planner requires portrait cards to sit in the right-hand columns; Bastion is both since it became portrait.

### TASK-002 Open the dock's attached menus downward when navigation is at the top
- Status: todo
- Tags: area/dock, kind/feature
- Related: REQ-014
- Acceptance: with Navigation → Position set to Top, the site index menu opens fully on screen below the dock, and the status stack and floating assistant sit below it. Verified in a browser at 1440×900 and a phone width. This needs the shape-morphing geometry in `dist/dock-morph.js` to support a downward branch.

### TASK-003 Re-encode bastion.mp4
- Status: todo
- Tags: area/images, kind/debt
- Acceptance: the file is a few MB, like the other project videos (it is about 31MB), still plays smoothly on hover at 786×1704 and keeps the portrait shape.

### TASK-004 Repair the six tests that assert old catalog contents
- Status: todo
- Tags: area/tests, kind/debt
- Acceptance: content-model, home-about, home-layout, home-sections, interaction-commands and project-media-focus pass, either against the current catalog or by using fixtures that no longer depend on live content. Decide which, per test, with the owner.

### TASK-005 Fix the two tests affected by card-sphere work
- Status: blocked
- Tags: area/tests
- Blocked by: the owner's in-progress card-sphere changes
- Acceptance: project-entry-memory (the sphere viewer reads `document` inside a Node sandbox) and text-list-hover (a Porter fixture assertion) pass.

### TASK-006 Align catalog2.json with catalog.json for Bastion
- Status: todo
- Tags: area/content, kind/debt
- Acceptance: decide whether the second content set should follow the first. Today catalog2 still has Bastion as a landscape card with the landscape bastion2.mp4, while catalog has it portrait with bastion.mp4. Both sets must keep building.

### TASK-007 Give Porter its own backdrop
- Status: todo
- Tags: area/images, area/content
- Related: REQ-002
- Acceptance: a `porter-bg.jpg` (photo-only export) is added to dist/assets, linked with `backgroundMediaId` in both catalogs, `npm run images` run, and Porter shows it in the featured stage. Needs the image from the owner.

### TASK-012 Register the memory server with the owner's MCP client
- Status: todo
- Depends: TASK-009
- Tags: area/tooling
- Acceptance: the owner decides which client(s) (for example a project `.mcp.json` for Claude Code) and approves the configuration change; the client then lists the four `memory_*` tools. See docs/MEMORY_MCP.md. Nothing is registered today.

## Done

### TASK-010 Project memory structure and tooling
- Status: done
- Tags: area/docs, area/tooling, kind/process
- Related: REQ-001
- Evidence: `node scripts/memory.mjs check` reports healthy and tests/project-memory.mjs passes, 2026-10-26. Adds AGENTS.md, CLAUDE.md, PROJECT_STATE.md, PROGRESS.md, TASKS.md, docs/ (constitution, requirements, facts, six decisions) and scripts/memory*.mjs.

### TASK-011 Image freshness check and one-command regeneration
- Status: done
- Tags: area/images, area/tooling
- Related: ADR-001
- Evidence: tests/image-freshness.mjs passes; appending a byte to an original made `npm run check:images` exit 1 and `npm run build` stop before any later step, 2026-10-26.

### TASK-009 Expose project memory through a read-only MCP server
- Status: done
- Depends: TASK-010
- Tags: area/tooling, kind/feature
- Related: ADR-007
- Evidence: tests/memory-mcp.mjs passes, including a real stdio session, read-only tool annotations, path confinement and unknown-tool rejection, 2026-10-26. Built without a dependency; not registered (TASK-012).

### TASK-008 Commit the working tree
- Status: done
- Tags: area/deploy, kind/process
- Evidence: commits 83dbce2, 17fc2ba and 1ee57a1 (2026-10-26); a clean worktree of HEAD passes `build-content --check`, `check-images` and `memory check`. The owner's `agent*` feature (7 modules, 3 tests, 2 images and hunks in app.js, site.css, tokens.css, motion-tokens.js and client-styles.mjs) was left uncommitted on purpose.
