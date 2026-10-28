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

### TASK-013 Review the drafted discipline tags
- Status: todo
- Tags: area/content
- Acceptance: the owner confirms or edits `disciplines` for each project in both catalogs (Tracr's three are the owner's wording; the other eight were drafted from each project's role text), then rebuilds content.

### TASK-015 Build the case-study page from detail cards
- Status: todo
- Depends: TASK-016
- Tags: area/project-detail, area/content
- Related: ADR-009
- Acceptance: the project detail page renders `detailCards` down the page, one large card or two in a row, each with generous space and a smaller image or video inside, reusing the note card styling and tokens. The owner decides the maximum width or padding. Verified in a browser on a project with authored cards.

### TASK-016 Author real note cards
- Status: todo
- Tags: area/content
- Related: REQ-016
- Acceptance: each project's `homeCards` (and later `detailCards`) points at real media with titles and descriptions the owner approves, replacing the three cover-image placeholders. Needs the media and copy from the owner.

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

## Done

### TASK-018 Consolidate How I work content
- Status: done
- Tags: area/content, area/home
- Evidence: both catalogs now keep the five How I work principles only in `home-approach`; the duplicate `about-how-i-work` block is removed, the Home About heading is restored, About precedes How I work on Home, and `tests/home-about.mjs` plus `tests/about-page.mjs` pass, 2026-10-28.

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

### TASK-012 Register the memory server with the owner's MCP client
- Status: dropped
- Depends: TASK-009
- Tags: area/tooling
- Evidence: the owner decided on 2026-10-26 not to register the server and to maintain the Markdown memory directly. The server stays in the repository, unregistered (docs/MEMORY_MCP.md).

### TASK-014 Card details: client above, status, results and tags
- Status: done
- Tags: area/home, area/design-system
- Related: REQ-015, ADR-008
- Evidence: tests/card-details.mjs passes; browser check of the stacked order, default-off behaviour, Above over Inline, and the About gradient, 2026-10-26.

### TASK-017 Note cards under each featured project
- Status: done
- Tags: area/home, area/content
- Related: REQ-016, ADR-009
- Evidence: tests/note-cards.mjs passes; browser check at 1440×900 of three loaded cards per stage and a backdrop confined to the first row, 2026-10-26.

### TASK-001 Fix placement of featured portrait cards in 3+ column grids
- Status: done
- Tags: area/home, kind/bug
- Related: ADR-010
- Evidence: tests/masonry-placement.mjs passes with the planner unchanged; the conflict was a test assumption, resolved as ADR-010 (featured wins over portrait), 2026-10-27.
