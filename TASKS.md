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

### TASK-044 Services: six isometric illustrations and three hidden cards
- Status: blocked
- Tags: area/home, area/content
- Acceptance: Services shows Product design, Webdesign, Prototyping in code, Design systems, Accessibility audit, Brand and motion, each with its own isometric illustration; Interim design lead, Hiring and Coaching are kept in content with `hidden: true` and not rendered.
- Evidence: `info-card` gained an optional `hidden` boolean (dist/content/model.js), honoured by `servicesMarkup`; tests/home-sections.mjs asserts six cards and the three hidden titles absent, and passes. The six cards measured rendered with tokens.css and home-sections.css, no console errors, 2026-11-13. Illustrations are the rest poses of Hairline figures kept in ../hairline/ (dock, breakpoints, live, library, loupe, mark).
- Notes: tests/module-graph.mjs fails: first load 905,603 bytes against a 902,282 budget (+3.3 KB, from the illustration path data). Needs the owner to raise the budget or move the illustrations behind a route load. The Accessibility audit line is a placeholder awaiting the owner's copy.

### TASK-039 Answer the developer-settings questions left by the tidy-up
- Status: todo
- Tags: area/settings, kind/debt
- Acceptance: the owner has decided each item below and the panel reflects it.
- Notes: (1) Navigation "Show Work / About / Lab / Contact / Index" are all off in the published preset while those items still show: find what they control, then relabel or retire them. (2) Content set (catalog / catalog2) is disabled in the panel: remove it or say why in its label. (3) Edge shades (4 switches) and the section width menus duplicated on the Home and About tabs were left as they are. (4) "Mascott" tab spelling. (5) Liquid intensity, reflections, afterglow and overshoot are 0 in the preset, but they also feed ambient light, drag physics and materials, so they stay visible.

### TASK-038 Delete the retired developer settings' code paths
- Status: todo
- Tags: area/settings, kind/debt
- Acceptance: after the owner has used the tidied panel for a week (from 2026-11-06), each `.setting-retired` control in group 1 (hero carousel, featured stage, hero timeline, Flip/Flat layouts, native snap, glass cards, image ripple and blur, per-area control style overrides) is removed with its code path, storage key, `default-settings.js` and `settings-transfer.js` entries, and import ignores the old keys. The switches behind the merged menus (`settings-proxies.js`) may instead move their storage behind the menus.
- Notes: hiding rather than deleting first follows AGENTS.md; nothing is lost if a retired option is wanted back (remove its class).

### TASK-049 One gliding selection pill for the menu and connected buttons
- Status: done
- Tags: area/dock, kind/feature
- Acceptance: the selected background is a single independent element that is always present, glides to a hovered item and returns to the current one when the pointer leaves, in the menu and in connected setting buttons.
- Evidence: 2026-11-13. `dist/selection-pill.js` mounted on the dock menu and the two `.theme-options` groups; styles in `control-style.css`, `--selection-pill-duration` in `tokens.css`. `tests/visual/selection-pill.spec.mjs` (three checks: follows hover and returns, glides and respects reduced motion, connected buttons) passes. `npm run check` 156 of 170, the same 14 as HEAD.
- Notes: not placed behind a new setting, as it refines the existing highlight; it already follows the Animation setting. `tests/module-graph.mjs` was over its first-load budget on HEAD and this module adds about 3 KB to it.

### TASK-048 Milky light controls, visible button edges and a menu that follows text size
- Status: done
- Tags: area/dock, kind/bug
- Acceptance: light Outline and Glass stay legible over a photograph; controls read by tone with no edge stronger than the card edge and no colour cast; the menu does not clip its last item at any reader text size.
- Evidence: 2026-11-13. Light Outline and Glass fill with the neutral card grey (`--control-surface-rgb`) at 90–97% and 88–94% with a 20px blur; painted light surfaces use `--muted` for secondary ink (labels 4.5:1 or more over solid black) and lift the current item to `--panel`. Outline's edge is `--image-edge` in both themes; Glass has none. A first attempt with a 3:1 outline and a tinted glass was rejected by the owner the same day and removed. A ResizeObserver on the menu items re-measures `--nav-main-width`; without it the Settings icon overflowed by 5px at Large text. `tests/visual/control-contrast.spec.mjs` now has five checks, all passing; the text-size check fails without the observer. `npm run check` 156 of 170 and the dock browser specs fail only where HEAD does.
- Notes: Ghost has no surface, so it is not legible over a dark photograph by design. Dark-theme surfaces over a light photograph were not densified.
- Update 2026-11-14: light Outline now uses the composer's glass (white, 70%) instead of the card grey at 90–97%; see PROGRESS.md.

### TASK-047 Lift dark-theme idle menu links to 4.5:1
- Status: done
- Evidence: 2026-11-13. Dark `--nav-link-ink` goes from .58 to .64 lightness; the dark-theme run of `tests/visual/control-contrast.spec.mjs` passes in all three variants with Always dark glass on and off.
- Tags: area/dock, kind/debt
- Acceptance: the idle navigation link holds 4.5:1 in the dark theme in Ghost, Outline and Glass, and `tests/visual/control-contrast.spec.mjs` covers the dark theme too.
- Notes: measured 2026-11-13 at 4.35:1 (Ghost), 4.43:1 (Outline) and 3.90:1 (Glass); `--nav-link-ink` in the dark theme is `oklch(.58 .01 300)`. Left alone because TASK-046 was scoped to the light theme.

### TASK-046 Make light-theme controls legible in Ghost, Outline and Glass
- Status: done
- Tags: area/dock, kind/bug
- Acceptance: in the light theme, control labels hold 4.5:1 and icons 3:1 in all three variants, with Always dark glass on or off, and an open menu has a surface in Ghost.
- Evidence: 2026-11-13. Cause: Always dark glass gave the dock and header controls light-on-dark ink in every variant, but only Outline painted a dark surface (measured 1.1–2.0:1 in Ghost and Glass, 2.6–4.1:1 for Outline's Go Back, arrows and menu options). The palette now skips Ghost; Glass and Outline are denser over a light page and the header buttons get the dark glass tokens; light `--nav-link-ink` and `--nav-item-ink` are darker; Ghost borrows the Outline surface while a menu is open. New `tests/visual/control-contrast.spec.mjs` passes (fails on HEAD's CSS). `npm run check`: 156 of 170, the same 14 failures as with these CSS files at HEAD. control-styles: 4 of 5, the footer press check fails identically on HEAD.

### TASK-037 Repair the failing browser checks
- Status: todo
- Tags: area/tests, kind/debt
- Acceptance: `npm run test:visual` passes; for each failure decide, with the owner, whether the page or the check is wrong.
- Evidence: 2026-11-03, 62 of 75 pass. Reproducible alone and on a clean worktree of HEAD (so not from uncommitted work). Already failing on 2cb9174: card-padding (bottom inset 59px with padding off), card-sphere (screenshot differs by 1%), card-spiral (a grid card does not open its project), carousel-glow ×4 (card image never finishes loading within 5s), native-snap (scroll-snap is `none`, expected `x mandatory`). Since ca647d9: assistant-info-card (`#askInput` never visible: the published preset hides the composer), errors (after Go Back the carousel centres a different card, so the next click opens Bastion, not Merlin), video-transition (the playing clip restarts 12 times across open and return). Since 9045a5a: dock-flash (detached glass briefly fuses back). Per-commit logs were taken with a script over ca647d9..481253a.
- Update 2026-11-10: 26 of 82 browser checks fail, not 12 (56 pass, including the seven added for TASK-040 and TASK-042). The same 26 fail on a clean build of HEAD, so none comes from the WP-05 to WP-14 work. Failing spec files: assistant-info-card, card-padding, card-sphere, card-spiral, carousel-glow (4), detail-title-spacing, dock-flash, dock-liquid, errors, mascot-settings (2), mascot-travel (2), mascot-webgl (2), mobile-content-width (tracr at 768px), native-snap, navigation-recovery, screencast, settings-panel, still-settle, video-bridge, video-transition. The card-sphere baseline now differs by 86% of pixels (it was 1%); the sphere renders correctly, so its baseline image is probably stale after the Rios asset changes. Not yet separated into stale checks and real defects.

### TASK-034 Repair preset tests that assume legacy style fields
- Status: done
- Tags: area/settings, area/tests, kind/debt
- Acceptance: settings-transfer and site-settings use explicit legacy fixtures for migration checks, and test the current published preset through its explicit controlStyle/cardGlassStyle fields. Both checks pass without changing application styling.
- Evidence: Focused checks expose existing preset drift: settings-transfer.mjs:156 expects glass while the published profile explicitly selects outline; site-settings.mjs:22 builds an empty legacy preset from plainNav/glassStyle fields no longer present in the current export, 2026-10-29.
- Evidence: 2026-11-03 settings-transfer checks the published preset's explicit controlStyle and cardGlassStyle; site-settings migrates an explicit legacy profile (plainNav, glassStyle) and checks the published preset names its style. Both pass; no application change.

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
- Status: done
- Progress: 2026-11-03 home-about and home-sections repaired against the current catalog (row count and years, testimonial names); project-media-focus now counts watch links and expects the prototype button under the picture, and fails later at its pins on the close button's old border and fill. content-model, home-layout and interaction-commands remain (the first and last expect duplicate card ids such as `rios-02` that the home layout no longer produces).
- Tags: area/tests, kind/debt
- Acceptance: content-model, home-about, home-layout, home-sections, interaction-commands and project-media-focus pass, either against the current catalog or by using fixtures that no longer depend on live content. Decide which, per test, with the owner.
- Evidence: 2026-11-03 all six pass. Live content where it is the point (Experience rows, quote authors, prototype and watch links, Porter's home card, capability counts derived from the catalog); fixtures where it is not (duplicate placements such as rios-02 and playstation-02 are added to a copy of the catalog). home-layout also measured NaN heights in its fake DOM and passed for the wrong reason; its cards now have sizes and its heights must be numbers.

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
- Status: done
- Tags: area/tests
- Acceptance: project-entry-memory (the sphere viewer reads `document` inside a Node sandbox) and text-list-hover (a Porter fixture assertion) pass.
- Evidence: 2026-11-03 project-entry-memory gives the Back adapter a `document` with no open sphere viewer, and a second case checks Back closes an open one first; text-list-hover already passed. Both pass.

### TASK-006 Align catalog2.json with catalog.json for Bastion
- Status: done
- Tags: area/content, kind/debt
- Acceptance: decide whether the second content set should follow the first. Today catalog2 still has Bastion as a landscape card with the landscape bastion2.mp4, while catalog has it portrait with bastion.mp4. Both sets must keep building.
- Evidence: 2026-11-03 the owner's last catalog2.json differed from catalog only in Tracr, so Bastion already matched; catalog2 now extends catalog (`content/catalog2/`), so it follows catalog for Bastion and everything else.

### TASK-007 Give Porter its own backdrop
- Status: todo
- Tags: area/images, area/content
- Related: REQ-002
- Acceptance: a `porter-bg.jpg` (photo-only export) is added to dist/assets, linked with `backgroundMediaId` in both catalogs, `npm run images` run, and Porter shows it in the featured stage. Needs the image from the owner.

## Done

### TASK-068 One drag feel for every carousel
- Status: done
- Tags: area/motion, area/home, kind/feature
- Acceptance: every draggable carousel uses `dist/carousel-drag.js` (1:1 drag, speed sampled per 16 ms frame, momentum ×0.95 per frame stopping under 0.2, 10px touch slop with axis lock, multi-touch cancels, no click after a fling or a real drag) and `dist/drag-cursor.js` (circular Drag cursor on hover devices only). Done for the hero filmstrip, the card gallery (all variants) and the card rail (Services, About traits). `card-infinite.js` is excluded: it is a 2D/3D flight space with its own physics, not a horizontal carousel, and an axis lock would break its vertical panning.
- Evidence: Phase 1: 2026-11-18. `tests/hero-carousel.mjs` rewritten, `tests/hero-carousel-settings.mjs` follows the CSS; headless Chromium with the filmstrip setting on: cards 739×508 / 500×380 / 494×340 at 1440 / 1000 / 390px, 24px gaps, drift 51.3 / 34.9 px/s (one set per 150 s), no horizontal page overflow, the Drag cursor shown on hover and absent on touch, the 0.93 press scale and 1:1 mouse drag, a 150px touch swipe moves 151px, a vertical swipe scrolls the page, 0 page errors. `npm run check`: 158 of 179; all 21 failures also fail on a clean HEAD.
  Phase 2: 2026-11-18. `card-gallery.js` takes its input from `CarouselDrag` and shows the Drag cursor; the circular ring coasts on the shared decay and stops where the momentum runs out (no snap after a drag; arrows, keys and the wheel still snap); the scroll variants coast a mouse fling and then centre the nearest card, while touch stays native. `tests/circular-card-gallery.mjs` asserts the coast never reverses; `tests/card-gallery.mjs` drives the new input. Headless Chromium at 1440px, circular and perspective: cursor shown, 0.93 press scale, 0 direction changes while coasting, no navigation from the fling, 0 page errors; at 390px touch drags the ring and a vertical swipe scrolls the page. `npm run check`: the same 158 of 179.
  Phase 3: 2026-11-18. `card-rail.js` takes mouse input from `CarouselDrag` (1:1 from the first pixel), coasts a fling with snapping held off, then settles on the next card in the travel's direction; touch stays native. `tests/card-rail.mjs` asserts 1:1 drag, a coast that never reverses, a forward-only settle and no click after a fling. Headless Chromium, Services as a carousel at 1440px: a 150px drag moved 150px, 0.93 press scale, Drag cursor shown, 36 coasting frames with 0 backward steps, 0 page errors. A lost mouse release (a move with no button held, lost capture, window blur) now ends any drag, reproduced in Chromium on both gallery variants. `npm run check`: the same 158 of 179.

### TASK-067 About, Contact and Home enter like a project
- Status: done
- Tags: area/motion, kind/feature
- Acceptance: About and Contact enter through the page transition with the project reveal: the h1 streams (Heading reveal settings), then the intro paragraph, links, photos and each following section fade in a step apart. Returning to Home from a project, About or Contact streams the hero h1 (its markup restored when it settles) and staggers the logos in. Motion → "Page slide" (`prem-page-slide`, exported) restores the previous sideways slide and fade. Default is the new motion at the owner's request, an exception to ADR-005.
- Evidence: 2026-11-16. Headless Chrome at 1280px, sampled every 70ms: with Page slide off, the About, Contact and Home headings stream and paragraphs and logos fade 0→1, including Back from Tracr; with it on, the old slide and fade are unchanged; no page errors. tests/home-hero-return.mjs and tests/simple-transitions.mjs updated to the new call sites. `npm run check`: 158 of 180; the other failures follow owner content edits, plus the first-load budget.

### TASK-066 One control size for nav, buttons and arrows
- Status: done
- Tags: area/design-system, kind/feature
- Acceptance: Settings → Design system → "Control size" (Default, Small 32px, Medium 36px, Large 44px; tokens `--control-size-sm|md|lg`) sets one height for nav items, the dock, footer and contact pills, rail and carousel arrows, the settings and assistant toggles, glass utility buttons and media actions, from 651px up; phones keep the 44px touch size. Default keeps each control's previous size (ADR-005); setting `prem-control-size`, exported. The Nav item padding, Nav container padding and Nav font size knobs are removed: nav padding is fixed at the published 4px (`--nav-item-padding`), container padding at 0, and nav text follows the global body size at every width.
- Evidence: 2026-11-16. Headless Chrome on About at 1280px: Small 32, Medium 36, Large 44 for nav, arrows, rail, toggles and footer pills; Default unchanged (nav 36, arrows and toggles 40); 390px stays 44. Removed keys dropped from settings/prem-portfolio-settings-2026-11-07.json so published settings load without the "unsupported controls" error. 25 related tests pass.

### TASK-065 Load the first visible images first
- Status: done
- Tags: area/images, kind/feature
- Acceptance: when a view renders, the `LEAD_IMAGES` (2) content images with the most visible area load at once at high priority, without waiting a frame for the observer; chosen once per view; backdrops and below-fold images keep their place in the queue. Home's project order in `layouts.json` matches `home.json` (Vodafone Travel, Tracr, The Body Shop, PlayStation, Gala, Bastion, Vodafone IoT, Merlin, Porter, Rios).
- Evidence: 2026-11-15. tests/media-loading.mjs covers the leads, visible-area ranking, once per view and the queue after. Headless Chrome at 1440x900: Home requests Vodafone Travel and Tracr at High; About requests the two most visible photos at High and the other four at Low (before: all content images Low, and About boosted four, missing the centred photo). `npm run check`: 159 of 179, no new failures.

### TASK-064 Fade images in as they load and scroll into view
- Status: done
- Tags: area/images, area/motion, kind/feature
- Acceptance: with Settings → Images → "Fade images in" on, a content image fades in (opacity, `--duration-media-reveal` 420ms, `--ease-settle`) when its bytes arrive; one below the fold at first render waits until it scrolls into view, then fades. Backdrops keep their own entrance, morph targets never fade, and reduced motion or animation off shows images at once. Off by default (ADR-005), setting `prem-media-reveal`, exported.
- Evidence: 2026-11-15. tests/media-loading.mjs covers fade on load, waiting below the fold, backdrops, morph targets and the setting off. Headless browser at 1440x900 with the setting on: Home faded 2 images on load and 8 more on scroll, About 5 on load and 5 on scroll; no image left at opacity 0. Skullet (npm, 0.0.3, React/Vue/Svelte peers) was reviewed and not added; only its reveal approach was borrowed.

### TASK-063 Chat width preset
- Status: done
- Tags: area/assistant
- Acceptance: the chat column takes its own width preset; Default leaves the built-in widths alone.
- Evidence: recorded after the fact on 2026-11-15 from the uncommitted diff. Control `#chatWidth`, setting `prem-chat-width` (default `default`, exported). Default removes `--chat-width`, so portfolio-assistant.css keeps its own widths; a preset sets it from `CONTENT_WIDTHS` (app.js). tests/content-widths.mjs asserts the control, the mapping and the Default path, and passes 2026-11-15.

### TASK-062 Logo size preset
- Status: done
- Tags: area/design-system, area/home
- Acceptance: the hero logo strip has its own size and does not change with Spacing.
- Evidence: recorded after the fact on 2026-11-15 from the uncommitted diff. `data-logo-size` small .75, medium 1, large 1.4 sets `--logo-scale` (design-system.css). The strip sizes from the new `--space-base` (4px, before Spacing density), so Spacing never changes it; centred, it spans the middle four of six columns. Documented in DESIGN_SYSTEM.md. tests/design-system.mjs passes but does not assert `logoSize`, so no test covers it.

### TASK-061 Section spacing preset
- Status: done
- Tags: area/design-system
- Acceptance: the gaps between sections can be set on their own, on top of Spacing.
- Evidence: recorded after the fact on 2026-11-15 from the uncommitted diff. `data-rhythm-size` xsmall .5, small .75, medium 1, large 1.35, xlarge 1.75, xxlarge 2.25 sets `--rhythm-scale`, which multiplies `--space-page-rhythm-sm/md/lg` (tokens.css). The new `--space-hero-exit` (6 units × rhythm) replaces the section gap between the home hero and the work below it, and between a project title and its hero image. Documented in DESIGN_SYSTEM.md. tests/design-system.mjs passes but does not assert `rhythmSize`, so no test covers it.

### TASK-060 Spacing in six steps
- Status: done
- Tags: area/design-system
- Acceptance: Spacing offers six densities.
- Evidence: recorded after the fact on 2026-11-15. Committed in 4e416c3 (2026-11-14) without an entry: `spaceSizes` xsmall to xxlarge in design-system.js, with `--space-density` .6, .8, 1 (medium, no rule), 1.2, 1.45 and 1.75 in design-system.css. tests/design-system.mjs covers `spaceSize` and passes 2026-11-15.

### TASK-059 Stage reveal once per visit (WP-17 item 4)
- Status: done
- Tags: area/motion, area/home
- Acceptance: behind a setting, default off, each featured stage reveal plays once per visit instead of replaying after it leaves the screen.
- Evidence: setting `prem-stage-reveal-once` (control `#stageRevealOnce` beside the retired Featured stage control, default `false`, in settings-transfer.js). `dist/feature-stage-reveal.js` remembers played stages by card id for the page load, so re-renders do not replay them either. `scripts/measure-stage-reveal.mjs` uses 6 stages and 3 scroll passes: off gives 18 reveals (3 per stage), as before; on gives 6 (1 per stage); two runs each, 2026-11-15. tests/feature-stage-reveal.mjs passes. `npm run check` 160 of 178, the same 18 failures as before this work. module-graph's first load grew 1.1KB (it was already 42KB over budget).

### TASK-058 WebGL contexts on home (WP-17 item 3)
- Status: done
- Tags: area/motion
- Acceptance: count live WebGL contexts with all home cards mounted, in each home layout; if the count scales with cards, report it with the module that creates them.
- Evidence: `scripts/measure-webgl-contexts.mjs` covers 11 home layouts (carousel, text, and cards × 3 views × 3 layouts), all 16 cards mounted, with a wheel scroll down and up plus two layout reflows after every image has loaded. Each layout is checked against the live settings selects. Defaults (ripple and blur off): 1 live context in every layout, from `mascott-embed.js`. With `--effects`: a peak of 3 (the mascot plus at most 2 from `liquid-image.js`), and up to 7 created in total, so they are released as motion ends. The count does not scale with cards. Two runs with effects on were identical, 2026-11-15. Not covered: carousel drag momentum, and the card world (three.js), which is a route, not a home layout.

### TASK-057 Blur budget (WP-17 item 2)
- Status: done
- Tags: area/motion
- Acceptance: count elements with a non-`none` computed `backdrop-filter` in the viewport on home, a project page and the assistant; report the counts; propose a cap, do not apply it.
- Evidence: `scripts/measure-blur-budget.mjs`, two identical runs, 2026-11-15, counting elements and `::before`/`::after` at four scroll stops. Peak layers in view at 1440×900: home 6, project (`#galachain`) 6, assistant 5. At 390×844: home 4, project 3, assistant 5. Every layer uses 22px (`--dock-glass-blur`); peak share of the viewport covered by blurred layers is 2.3% on desktop and 14.9% on the phone assistant. The DOM holds 31 to 33 blurred elements, most of them off-screen or hidden. `#rios` no longer opens a project page, so `#galachain` stands in. The proposed cap (see PROGRESS.md 2026-11-15) was approved by the owner and is now enforced by tests/visual/blur-budget.spec.mjs: at most 6 layers in view, a radius no higher than `--dock-glass-blur`, no layer above 25% of the viewport, across 3 routes, 2 viewports and 4 scroll stops. It passes 6 of 6 twice. With the cap at 5, exactly home and project at 1440×900 fail.

### TASK-056 Layout-animating rules (WP-17 item 1)
- Status: done
- Tags: area/motion
- Acceptance: measure in the page first; report each `will-change`/transition naming layout properties with what it animates and whether transform is feasible; change only the ones the owner picks.
- Evidence: `scripts/measure-layout-motion.mjs` (CDP counters, single process, `--dev` server). Card open and return: about 120 to 140 layouts costing 14 to 16ms, against 110 to 160ms of style recalculation, so layout is around a tenth of the work. `.flow-shell` and `.motion-afterglow` stay as they are, because scaling would distort the children and the radius that changes per frame. The owner chose the recommendations; the only rule changed is `.project-menu-preview`, which moved from `top`/`left` to `translate` with the same placement (preview centre equals row centre, 470/470). `.context-shape` matches no element (dead CSS, reported, not removed). `.selection-pill` keeps its `width`/`height`, because scaling would distort its radius. tests/project-menu-preview.mjs passes; the `durations` ceiling in tests/token-leaks.mjs drops to 132 (one literal fewer); `npm run check` 159 of 177, and none of the 18 failures imports the preview, 2026-11-15.

### TASK-055 Specimen page at #system (WP-16)
- Status: done
- Tags: area/design-system, area/tests
- Acceptance: a `#system` route renders each component from the real renderers with worst-case fixtures; the route has zero console errors; each component has a baseline; no existing page changes.
- Evidence: tests/system-specimen.mjs passes (17 components, exact ratios 0.46, 1.0, 1.6 and 2.33, project page shapes, worst-case and hostile content escaped, no links, developer mode only); tests/visual/system-specimen.spec.mjs passes 19 of 19 twice (zero console and page errors, a visitor without `?dev=1` never sees it, 17 element-scoped baselines, stable on a second run); `npm run check` 163 of 176 (the 13 under TASK-050), 2026-11-11. Two baselines were looked at and approved. Baselines are macOS only.

### TASK-054 Type floors behind a setting (WP-15a)
- Status: done
- Tags: area/design-system
- Acceptance: setting `prem-type-floor`, default off: caption and note at least 12px, reading 16px at Medium, tabular figures on years, metrics and times, `system-ui` first in the sans stack; captures on disk for the owner.
- Evidence: tests/type-floor.mjs passes; computed in a real page with the setting on: caption and note 12px, reading 14.58px at Small, 16px at Medium, 17.78px at Large, `system-ui` first, `tabular-nums` on `time` and `.content-metric`; with it off, caption 10px, note 11px, reading 14.4px, as before; `npm run check` 162 of 175 (the 13 under TASK-050), 2026-11-11. Captures: scratchpad `wp-15a/` (see PROGRESS.md). No literal font size was replaced with a role token (see PROGRESS.md).

### TASK-053 Golden questions for the live model (WP-13)
- Status: done
- Tags: area/assistant, kind/process
- Acceptance: one command measures real answer quality; running without keys exits non-zero with a clear message; a mocked-provider test covers the scoring.
- Evidence: tests/assistant-eval.mjs passes (seed file valid against the published documents, each scoring rule, six kinds of invalid file, a whole mocked run through the real request handler in which one answer fails as intended, and exit status 2 with the missing variables named when keys are absent); `npm run check` 161 of 174 (the 13 under TASK-050), 2026-11-11. Not run against a live model: no keys were used. The ten questions are a seed for the owner to review and extend to 30 or more.

### TASK-052 Knowledge moves into content/ (WP-12)
- Status: done
- Tags: area/assistant, area/content
- Acceptance: `content/knowledge.json` is the validated source of the profile facts, curated answers and suggested questions; the two existing modules are generated from it with identical exports; an unknown `sourceId` fails the build; generated files are marked in AGENTS.md and the constitution.
- Evidence: before changing anything, the exports of `dist/knowledge/profile.js` and `dist/assistant-knowledge.js` and four lookup probes were saved; after generation they are deep-equal. tests/knowledge-source.mjs passes (valid against both content sets, generated text equals what the generator writes, `build-content --check` passes, twelve kinds of mistake fail with named messages); worker-artifact and the assistant tests pass; `npm run check` 160 of 173 (the 13 listed under TASK-050), 2026-11-11.

### TASK-051 Structured project facts, schema only (WP-11)
- Status: done
- Tags: area/content, area/assistant
- Acceptance: a `portfolio-item` accepts optional `timeline`, `team`, `outcomes`, `decisions`, `tools` and `platforms` with validation; they reach the model when present; a project with none is unchanged; no rendering and no invented values.
- Evidence: tests/project-facts.mjs passes (every field validates; bad periods, shapes, a missing `evidenceId`, duplicate ids and a choice outside the options fail; facts are sent for a fixture project and not for projects without them or for pages), 2026-11-11. `npm run check` 159 of 172, the 13 failures being the ones listed under TASK-050.

### TASK-050 The assistant reads everything a visitor can (WP-10)
- Status: done
- Tags: area/assistant, area/content
- Acceptance: articles and news reach the model; an asset can carry a `description` that is sent with its blocks; the corpus is its own first message; tests fail if an article body, a news item or an asset description stops reaching the model; ASSISTANT.md updated.
- Evidence: tests/assistant-sources.mjs (articles with date, author, series and every block, news, media fixture), assistant-api, assistant-conversation, assistant-follow-up and site-config pass, 2026-11-11. The new test also found that table blocks never reached the model; fixed. No asset has a `description` yet (the owner's content to write).

### TASK-045 Card status as its own developer setting
- Status: done
- Tags: area/settings, area/home
- Acceptance: the status pill (Launched, Building, R&D) has its own Cards toggle, separate from Card details, off by default, persisted and exported with the other settings; Card details covers only the results line and tag row.
- Evidence: tests/card-details.mjs, tests/settings-transfer.mjs and tests/home-sections.mjs pass. In the dev page, toggling Card status and Card details in turn showed the pill and the tags independently, with the saved values surviving a reload and no page errors, 2026-11-13.

### TASK-043 Token leak ceilings and duration role tokens (WP-14)
- Status: done
- Tags: area/design-system, area/motion
- Acceptance: a test caps hex, literal duration and literal font-size counts outside tokens.css; `--duration-*` tokens exist for the fixed MOTION.md roles with a JavaScript twin where a module uses the value; matching literals replaced; no computed value changes.
- Evidence: tests/token-leaks.mjs passes with ceilings at the measured 74 hex colours, 133 durations and 67 font sizes (counting rules are in the test); tests/motion-tokens.mjs passes; computed tooltip animation and token reads checked in the page, 2026-11-10. Two literals became tokens (tooltip arrival, card copy fade-out); the rest do not match a role exactly and are listed in PROGRESS.md.

### TASK-042 Load by route: card worlds, module graph and preload list (WP-08)
- Status: done
- Tags: area/tooling, area/images
- Acceptance: a first visit to the home page does not download three.js or the card worlds; `scripts/module-graph.mjs` and `tests/module-graph.mjs` hold a budget; the hosted `index.html` preloads the static graph. Closed with the assistant, voice and dictation, hand tracking and developer settings left in the first load, by decision on 2026-11-10 (they mount at startup and are wired into the dock; converting them changes when the dock composer exists). Measured 2026-11-10: the code only they use is about 74 KB for the assistant (21 modules) and 12 KB for voice, against 839 KB total, because most of the assistant's 62-module subtree is shared with the rest of the app; recommended to close the task as done without converting them, unless the owner wants the saving.
- Evidence: first-load graph 185 modules and 1555 KB before, 174 modules and 839 KB (859,316 bytes) after, three.js unreachable; tests/module-graph.mjs and tests/visual/card-world-loading.spec.mjs pass (home never requests three.js, direct and in-app visits to a card world draw it, a blocked download keeps the page and shows the toast); `npm run check`, 2026-11-10.

### TASK-041 Asset roles are data, not naming (WP-06a)
- Status: done
- Tags: area/images, area/content
- Acceptance: optional `role`, `sourceCornerRadius` and `sourceEdgeInset` on an asset; one `isBackdrop` used by every script (JavaScript and Python); the Tracr matte radius and PlayStation edge inset read from `assets.json`; rendered output unchanged. WP-06b (deleting unreferenced files) stays blocked on D-3.
- Evidence: tests/asset-roles.mjs (Python twin agrees on every catalog asset, a `role`-only fixture is a backdrop in every script, schema accepts and rejects the new fields, quirks read from the catalog) and tests/nested-radii.mjs pass; `npm run check`, 2026-11-10.

### TASK-040 Detail layout chosen from the hero ratio (WP-05)
- Status: done
- Tags: area/home, area/design-system, area/images
- Acceptance: `data-detail-shape="wide|tall|square"` on the project page from `cardRatio`, with layouts keyed on it behind `prem-detail-ratio-layout` (off by default); tests for the three shapes; existing detail and handoff tests pass; one capture per shape on disk.
- Evidence: tests/detail-shape.mjs and tests/visual/detail-shape.spec.mjs pass (the card image and the page image end on the same ratio within 1%; tall is sticky at 1440 and capped at 70svh and centred at 600); `npm run check` 160 of 160, 2026-11-10. Captures: scratchpad wp-05 folder (see PROGRESS.md). Registered as TASK-040 because WP-00 to WP-04 have no entries yet.


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
