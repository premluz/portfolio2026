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

### TASK-034 Repair preset tests that assume legacy style fields
- Status: todo
- Tags: area/settings, area/tests, kind/debt
- Acceptance: settings-transfer and site-settings use explicit legacy fixtures for migration checks, and test the current published preset through its explicit controlStyle/cardGlassStyle fields. Both checks pass without changing application styling.
- Evidence: Focused checks expose existing preset drift: settings-transfer.mjs:156 expects glass while the published profile explicitly selects outline; site-settings.mjs:22 builds an empty legacy preset from plainNav/glassStyle fields no longer present in the current export, 2026-10-29.

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

### TASK-036 Soften card hover and press timing
- Status: done
- Tags: area/home, area/motion
- Evidence: Added independent card timing/easing tokens: hover 300ms standard, press 160ms press, release 360ms gentle. Depth and centred origin are unchanged; instant surface-colour mode no longer zeroes scale-hover duration. Build, press-feedback, motion-tokens and six browser checks pass, covering actual computed timing, settled scales, reduced motion/Animation Off and secondary text in four hover modes. Full check retains the existing About section-order assertion, 2026-10-29.

### TASK-035 Add mascot travel speed control
- Status: done
- Tags: area/settings, area/assistant, area/motion
- Acceptance: Mascott has a persisted Speed slider that controls travel pace and updates an active trip without changing its current position.
- Evidence: Added 25–300% speed with 100% preserving the current pace; travel, landing and teleport timing scale together. Active trips retain their path/progress when retimed. Engine checks pass across short horizontal and longer diagonal trips at 25/100/300%, including live changes and reduced motion. Build and all six browser checks pass, covering speed wiring, preset export/import/reload, desktop/phone layout and appearance. Three startup/material checks initially timed out under host load and passed on an isolated rerun; the full check retains the existing About order failure at tests/about-page.mjs:34. Local only, 2026-10-29.

### TASK-033 Add live Mascott appearance controls and fix initial configuration
- Status: done
- Tags: area/settings, area/assistant, kind/feature
- Acceptance: a Mascott tab after Motion exposes material/effect dropdowns, applies changes to the rendered mascot immediately and preserves choices through reload and preset import/export; initially visible and hidden mascots retain their selected look.
- Evidence: Added material, palette, glow effect/colour, motion effect and Liquid/Aura variety selectors plus the reused Show mascot switch. Controls share the preset allowlist and save live. Explicitly upgrade the detached custom element before setting config and resolve hidden stage size from CSS; this fixes the flat coral defaults. The tab bar sizes one column per tab. Build, five focused Node checks and all sixteen distinct browser checks pass, covering all eight materials, two appearance presets, visible/hidden startup, desktop/mobile layout, travel, reduced motion and PNG/context-loss fallback. Full check retains the About section-order failure at tests/about-page.mjs:34; additional stale preset checks are tracked in TASK-034. Local integration only, 2026-10-29.

### TASK-032 Preserve mascot drag physics during portfolio travel
- Status: done
- Tags: area/assistant, area/motion, area/tests
- Acceptance: the packaged character's glow smears and the body turns/deforms with portfolio travel, using the same physics as dragging; both settle after stopping, and reduced motion/animation off retain a still character.
- Evidence: Added inline container-motion tracking to the shared Mascott renderer loop and rebuilt the folio's standalone embed. Four new unit checks prove parity with dragging across horizontal/braking and diagonal/reversal datasets, plus safe placement/resizing and settling. All 175 package tests, package type/source checks, package builds, folio build, four existing agent/assistant checks and ten focused folio browser checks pass. Browser movement checks sample actual halo trail/body-deformation shader uniforms inside the page's frame clock. Full folio check retains the pre-existing About section-order failure at tests/about-page.mjs:34. Local integration only; remote deployment is outside scope, 2026-10-29.

### TASK-031 Replace the portfolio PNG mascot with packaged WebGL
- Status: done
- Tags: area/assistant, area/motion
- Acceptance: packaged Mascott replaces the image while retaining movement, sizing, assistant activation, visibility and motion settings; the original PNG appears during loading and on bundle/WebGL/context failure.
- Evidence: Integration and local production assets are built; desktop/mobile sizing, assistant activation, bundle/WebGL failure and GPU context loss/restoration pass in the focused browser suite. The shipped Show mascot setting remains authoritative. Remote deployment is outside scope; no Vercel authorization is needed, 2026-10-29.

### TASK-030 Balance mobile hero spacing and reveal the next carousel project
- Status: done
- Tags: area/home, area/design-system
- Evidence: On phones, the header-content-to-hero gap shares the medium rhythm used before the carousel. Horizontal home carousel widths are capped using existing gutter/gap/space tokens, and the mobile gap overrides oversized saved gaps so the next project peeks into view. Build, mobile-carousel, hero-viewport and 17 browser checks pass, including matched gaps/partial next-card visibility at 375/430px and full-width content checks across five routes. Full check retains the existing About section-order assertion, 2026-10-29.

### TASK-029 Verify mobile text widths and remove retained desktop tracks
- Status: done
- Tags: area/home, area/design-system, area/tests
- Evidence: Fixed About-page shared text grids and hero stacking plus the external home carousel caption at the existing 1000px narrow-content breakpoint. Build, content-widths and 17 browser checks pass: five routes at 375/600/768px, desktop Home half-width sections and detail title spacing. Full check retains the existing About section-order assertion, 2026-10-29.

### TASK-028 Match detail title/company spacing to carousel cards
- Status: done
- Tags: area/project-detail, area/design-system
- Evidence: Detail title-to-company/year margin now uses the same space-title-eyebrow token as the carousel card instead of space-4. Intro/image rhythm is untouched. Build, detail-caption unit check and browser gap comparison pass at desktop/mobile sizes with editorial headings on/off. Full check retains the existing About section-order failure, 2026-10-29.

### TASK-027 Keep card secondary rows faint on hover
- Status: done
- Tags: area/home, area/design-system
- Evidence: Removed secondary-row hover brightening and anchored its existing faint colour mix to the resting card/page surface instead of the hover-dependent fill. Heading and other hover feedback are unchanged. Build, press-feedback and four browser checks pass across both themes, two cards, all four hover modes, pointer/focus/gesture states. Full check retains the existing About section-order assertion, 2026-10-29.

### TASK-026 Remove the gallery toolbar and wrapper bottom spacing
- Status: done
- Tags: area/home, kind/bug
- Evidence: Removed the toolbar div and obsolete style/transition references, retaining its screen-reader heading. Grid, slots and placement wrappers have no padding/bottom margin; home-work has no bottom padding/margin. Build and two browser checks pass, covering regular/masonry desktop/mobile and adjoining About columns. Known home-layout height assertion still reports 516 !== 1060 at line 60; full check stops at the existing About section-order assertion, 2026-10-29.

### TASK-025 Align homepage About-related sections to one half-width column
- Status: done
- Tags: area/home, area/design-system
- Evidence: About introduction, How I work, Experience, Side projects and Thoughts occupy the left half-track on desktop, with full-width nested content and full-width mobile sections. About-page styles and other homepage components are unchanged. Build, content-widths and browser geometry checks at 1440px, 1920px and 390px pass. Full check retains the existing About section-order failure, 2026-10-29.

### TASK-024 Make footer label buttons fully rounded
- Status: done
- Tags: area/home, area/design-system
- Evidence: Footer labels use the dedicated pill-radius token without altering other controls or shared materials. Build, footer-switch and five browser tests pass, including pill geometry for both labels in all three control variants. Full check still stops at the existing About section-order assertion, 2026-10-29.

### TASK-023 Hide the empty navigation shell
- Status: done
- Tags: area/dock, kind/bug
- Evidence: The dock disappears when no direct navigation links/buttons remain, except while the composer or project controls are active. Build, menu-icon-settings and seven browser checks pass; Home and Lab cover each item's restoration, saved hidden state and composer availability, 2026-10-29.

### TASK-022 Make footer contact controls inherit button styling
- Status: done
- Tags: area/home, area/design-system
- Related: ADR-012
- Evidence: LinkedIn and Email inherit the global/Utilities control variant instead of forcing Ghost. The existing saved text option now selects labels versus icons, with padded rounded label buttons and no footer-specific material or hover overrides. Build, footer-switch, settings-transfer and site-settings checks pass; five browser tests pass, including footer materials across all three variants, hover/press, icon presentation, Utilities override and reload persistence, 2026-10-29.

### TASK-021 Consolidate Ghost, Outline and Glass control variants
- Status: done
- Tags: area/dock, area/design-system, area/assistant
- Related: ADR-012
- Evidence: Design → Controls now provides a global variant and five saved Inherit/local overrides, with element/group declarations taking precedence. Legacy flags and published/imported presets migrate without losing explicit choices; Glass cards is independent. Build, thirteen focused unit tests and five browser tests pass, covering both themes, desktop/mobile widths, dynamically created controls, all override groups, keyboard/hover/press, reduced motion, Animation Off and centred fullscreen Close. Full check still stops at the pre-existing About section-order assertion (`tests/about-page.mjs:34`), 2026-10-29.

### TASK-020 Match carousel controls and navigation to the header surface
- Status: done
- Tags: area/home, area/dock
- Evidence: gallery, section-rail and optional hero-carousel controls reuse `.glass-surface`; the always-dark nav outline shares the dark header outline token. Build and glass-style, card-rail, card-gallery, hero-carousel and dock-morph tests pass. Chromium confirms matching control materials for both themes, glass variants and plain-nav settings, plus matching normal/always-dark nav outlines, 2026-10-29.

### TASK-019 Share navigation surfaces across project controls and assistant suggestions
- Status: done
- Tags: area/project-detail, area/dock, area/assistant
- Evidence: removed the separate chrome-based media-control material; project navigation, media actions, full-screen Close and both suggestion placements use the shared navigation surface. Build, glass-style and suggestion-chip tests pass. Chromium computed-style checks pass for glass on/off, light/dark themes and portrait/landscape projects, including non-glass hover, 2026-10-29. The full check stops at the existing About section-order assertion in `tests/about-page.mjs:34`; the existing press-feedback source check also expects a removed plain-nav selector.

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
