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

### TASK-008 Commit the working tree
- Status: todo
- Tags: area/deploy, kind/process
- Acceptance: the uncommitted changes (about 36 paths on 2026-10-26) are committed in coherent commits, including the generated image copies, `dist/assets/backgrounds/` and `dist/image-variants.js`, so the deploy check passes. Review before committing: the owner has unrelated in-progress edits (card sphere).

### TASK-009 Expose project memory through a read-only MCP server
- Status: todo
- Depends: TASK-010
- Tags: area/tooling, kind/feature
- Acceptance: not installed. A read-only interface offering search, reads and task context with source references, kept separate from users' chat content. Propose and get approval before installing anything.

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
