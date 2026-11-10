---
title: Execution brief for the 2026-11-10 review
type: spec
status: draft
owner: Prem
updated: 2026-11-10
summary: Work packages that turn the architecture and design-system review into changes an agent can execute one at a time, each with files, steps, acceptance and stop conditions.
tags: [area/tooling, area/content, area/images, area/assistant, area/design-system, area/motion, kind/process]
related: [AGENTS.md, TASKS.md, CONTENT_MODEL.md, MEDIA_ASSETS.md, MOTION.md, DESIGN_SYSTEM.md]
---
# Execution brief for the 2026-11-10 review

This brief is written for a coding agent working in this repository. It does not replace [AGENTS.md](../AGENTS.md) or the [constitution](CONSTITUTION.md); where they disagree, they win and you stop and report.

## How to use this brief

1. **One work package (WP) per session.** Finish, verify, report, stop. Do not start the next one unprompted.
2. **Register before you start.** Add the WP to [TASKS.md](../TASKS.md) as the next free `TASK-nnn` (the highest today is TASK-039), with the Acceptance text from this brief. Task status lives only there.
3. **Read before you write.** Each WP lists files to read first. Line numbers in this brief were correct on 2026-11-10 and will drift; find the code by the quoted identifier, not the number.
4. **Respect the dirty worktree.** 17 files had uncommitted owner changes on 2026-11-10, including `content/catalog/presentations.json` and Rios media. Never `git checkout`, `reset` or `restore` a file to undo your own edit; revert your lines by hand.
5. **Authored code lives in `dist/`.** Edit `dist/*.js|css|html`, `content/catalog*`, `scripts/`, `worker/`, `tests/`, docs. Never edit `dist/client/`, `dist/server/`, `dist/content/` exports, `dist/site.css`, `dist/image-variants.js`, `dist/assets/optimised/` or `dist/assets/backgrounds/`; regenerate them.
6. **Match the house style.** Authored modules are dense, with long lines and one-space indentation. Do not reformat lines you are not changing.
7. **New visible behaviour starts off behind a setting** (ADR-005), persisted and exported through `dist/default-settings.js` and `dist/settings-transfer.js`. WPs that say "behind a setting" mean this.
8. **No new dependencies, no deleted files, nothing published** without the owner's explicit yes.
9. **Finish every WP the same way:** run the WP's own checks, then `npm run build` and the all-tests loop from AGENTS.md; update TASKS.md with Evidence; append to PROGRESS.md; run `npm run memory:index && npm run memory:check`. Report in six lines or fewer: what changed, files touched, verification result, open risks.

## Baseline on 2026-11-10

| Measure | Value | How to reproduce |
| --- | --- | --- |
| Node tests | 150 of 156 pass | the loop in AGENTS.md |
| Failing | `card-gallery`, `content-model`, `home-layout`, `interaction-commands`, `project-media-focus`, `text-list-hover` | `node tests/<name>.mjs` |
| Browser tests | 63 of 75 pass (TASK-037) | `npm run test:visual` |
| Static module graph from `dist/app.js` | 182 modules, about 1,548 KB raw, includes `vendor/three/three.module.js` (692 KB) | WP-08 adds the script |
| Assets with `width` and `height` | 4 of 42; no video | `content/catalog/assets.json` |
| Files in `dist/assets/` no asset record names | 13, 10.5 MB | compare the folder with `assets.json` URLs |

A WP may not make any of these worse. If a number differs before you start, record the new baseline in your report first.

## Corrections to the review

Three statements in the review document were imprecise. Work from these instead.

- `imageMarkup` in `dist/media-loading.js` already writes `width`, `height` and a ratio-dependent `sizes` on card images. The gap is that videos and layout code do not get the same data.
- The `max-age=3600` header is the Node server's (`deploy/node-server.mjs`). A comment in `dist/media-loading.js` says Vercel serves `max-age=0, must-revalidate`. WP-09 starts by measuring the live headers.
- Failing browser tests and settings retirement already have tasks: TASK-037 and TASK-038. Do not duplicate them.

## Decisions the owner must make

A WP marked **Blocked** cannot start until its decision is recorded here or in an ADR.

| ID | Decision | Blocks |
| --- | --- | --- |
| D-1 | Are the six failing tests wrong, or is the Porter and Rios content unfinished? | WP-00 |
| D-2 | The site's public origin (for canonical links, Open Graph and the sitemap) and the URL scheme. Proposed: `/work/<slug>`, `/writing/<slug>`, `/about`, `/contact`, `/lab`. | WP-07 |
| D-3 | May the 13 unreferenced files in `dist/assets/` be deleted, and may originals move out of the served folder? | WP-06b |
| D-4 | Typeface, and the production type scale. | WP-15b |
| D-5 | Which home layout and control style are the production ones (feeds TASK-038). | WP-16 |
| D-6 | May a formatter be added as a dev dependency, and may authored code move from `dist/` to `src/`? | WP-18 |

## Order

`WP-00 → WP-01 → WP-02 → WP-03 → WP-04 → WP-05` is the asset track and must run in that order. `WP-08`, `WP-10` and `WP-14` are independent and can be taken any time after WP-01. `WP-07` needs D-2.

---

## WP-00 Get the Node suite green

- **Goal.** All 156 Node tests pass, with no test weakened to get there.
- **Read first.** The six failing tests; `content/catalog/index.json`, `layouts.json`, `presentations.json`; `content/catalog/projects/porter.json`; `git status --short`; `git diff -- content/`.
- **What is known.** Messages name Porter three times ("Porter has a media card linked to its detail route", "resolve Porter from the complete published registry") and counts of 8 where a different number is expected. `projects/porter.json` is in `index.json`; Porter has no entry in `layouts.json` or `presentations.json`. That pattern suggests content in progress, but it is a hypothesis.
- **Do.** For each failing test, state in one line whether the content or the assertion is out of date, with the evidence. Then stop and present the six lines to the owner (D-1). Apply only the fixes the owner confirms.
- **Do not.** Edit a test expectation to match current output without that confirmation.
- **Acceptance.** The all-tests loop prints no `FAIL`. `PROJECT_STATE.md` states the real count.

## WP-01 `npm run check` reports every failure

- **Goal.** `npm run check` runs every test file and prints a summary, so the shell loop in AGENTS.md is no longer needed.
- **Read first.** `scripts/check.mjs` (9 lines), AGENTS.md → Commands.
- **Do.** Run each `tests/*.mjs` in its own Node process, collect exit codes, print `FAIL <file>` with the first error line for each failure, then `n of m passed`. Exit 1 if any failed. Keep the existing `build-content.mjs --check` and image checks running first and still fatal.
- **Docs.** Replace the loop in AGENTS.md and PROJECT_STATE.md with the new behaviour in the same change.
- **Acceptance.** With one test deliberately broken locally, `npm run check` names it, still runs the rest, and exits 1. Restore the test by hand afterwards.

## WP-02 The build measures every asset

- **Goal.** Every published image and video asset in the exported catalog has `width` and `height`, generated, never typed.
- **Read first.** `scripts/build-content.mjs`, `deploy/development.mjs` (dev serves the catalog without the build), `scripts/optimise-images.py`, `dist/image-variants.js` (generated; has `width`/`height` per image URL), `dist/content/model.js` line with `asset:{anyOf:` (the schema already allows integer `width` and `height`, so no schema change is needed).
- **Do.**
  1. Add `scripts/media-metadata.mjs` exporting `measureAsset(asset, distDir)` → `{width, height}` or `null`.
     - Images: read from `imageVariants[asset.url]`.
     - Backdrops (`id` ends in `-bg`) and SVG: return `null`; they are not card or block media.
     - MP4 video: parse the file in plain Node. Walk boxes `moov → trak → tkhd`; take the first track whose width and height (16.16 fixed point, the last eight bytes of `tkhd`) are both non-zero. Read only box headers and `tkhd`; do not load the whole file.
     - If the `tkhd` matrix is not the identity (a rotated recording), throw an error naming the file. Do not guess the displayed size.
     - Any other container: throw, naming the file and extension.
  2. Add one function, `withMeasuredMedia(catalog, distDir)`, that returns the catalog with measured values filled in. If an asset has authored `width`/`height` that differ from the measurement, throw with both values.
  3. Call it from `build-content.mjs` before `exportPublishedCatalog`, and from the dev path so `npm run dev` shows the same data. One implementation, two callers.
- **Do not.** Add ffprobe or any package. Write measured values back into `content/catalog/assets.json`.
- **Verify on a second dataset.** Unit-test the MP4 reader against at least three real files with different shapes: `dist/assets/merlin.mp4` (1440 × 900), `rios.mp4` (393 × 852), `bastion.mp4` (1920 × 1200), plus a truncated buffer and a non-MP4 buffer, both of which must throw.
- **Then report, do not enforce.** Print every pair where a poster and its video (`heroMediaId` with `hoverVideoId`; a video block's `posterMediaId` with `mediaId`) differ in ratio by more than 1%. Leave it as a printed list and give it to the owner; making it fatal is a follow-up.
- **Acceptance.** New test `tests/media-metadata.mjs` passes; in `dist/content/catalog.json` every published non-backdrop, non-SVG asset has `width` and `height`; `build-content.mjs --check` still detects stale output.

## WP-03 Orientation is derived

- **Goal.** A project no longer needs `card.orientation`. An authored value still wins.
- **Depends on.** WP-02.
- **Read first.** `dist/content/model.js` (`presentation:object({…card:object({orientation…},['orientation','surface'])`), `dist/content/provider.js` (`cardAspect:p?.card.orientation||'landscape'`), `dist/documents.js`, `tests/content-model.mjs`, `tests/masonry-placement.mjs`.
- **Do.**
  1. Schema: remove `orientation` from the `required` list of `presentation.card`. Keep the enum.
  2. Provider: project `cardRatio` (hero asset `width / height`, or `null` without hero media) onto the card. Set `cardAspect` to the authored orientation if present, otherwise `portrait` when `cardRatio < 1`, otherwise `landscape`.
  3. Leave every existing `orientation` value in `presentations.json` untouched.
- **Verify on a second dataset.** Test (a) for every current project, the derived value equals the authored one, and list any that differ in your report instead of changing content; (b) fixtures with ratios 0.46, 1.0, 1.6 and 2.33 and a text-only card with no media.
- **Docs.** CONTENT_MODEL.md and MEDIA_ASSETS.md step 2 ("Set the card orientation") become "optional override".
- **Acceptance.** A fixture project with no `orientation` validates and renders with the right `data-card-orientation`; all tests pass.

## WP-04 Masonry and the image frame follow ratio

- **Goal.** With a new setting on, card height in the masonry grid comes from the hero's ratio, for any ratio, with no `portrait` branch.
- **Depends on.** WP-03. **Behind a setting** `prem-masonry-ratio`, default off.
- **Read first.** `dist/placement.js` (`masonryRows`, `masonryMinimumHeight`, `masonryPlan`; note it already accepts a `heights` map), `dist/home-layout.js` around the `masonryPlan` call, `dist/image-frame.js` (the block starting `if(this.card?.dataset.cardPresentation==='current'`), ADR-010, `tests/masonry-placement.mjs`, `tests/image-fit.mjs`.
- **Rule to implement.**

  ```
  imageHeight = min(columnInnerWidth / ratio, maxImageHeight)
  imageWidth  = imageHeight * ratio
  cardHeight  = paddingEnds + copyHeight + margin + imageHeight
  rowSpan     = masonryRows(cardHeight, gap, row)
  ```

- **Do.**
  1. `home-layout.js`: when the setting is on, compute `cardHeight` per item from `cardRatio` with the rule above and pass it through the existing `heights` argument for every column count.
  2. `placement.js`: when given `heights`, choose the preferred column from the resulting `rowSpan`, not from `cardAspect`: an item at least 1.5 times the median span prefers the right-hand columns; `featured` still leads on the left (ADR-010 unchanged).
  3. `image-frame.js`: when the setting is on, use `imageWidth = min(available - sides, maxWidth, min(maxHeight, room) * ratio)` for every card and centre the image when it is narrower than the frame. This is the existing portrait formula applied to all ratios.
  4. With the setting off, output must be identical to today. Assert that in a test by comparing plans for the current home items.
- **Do not.** Remove the existing portrait code paths; that is a later clean-up once the owner switches the setting on.
- **Verify on a second dataset.** Planner tests with ratios 0.46, 0.75, 1.0, 1.6, 2.33 and one text-only item, at 2, 3 and 4 columns: no overlap, no item outside the grid, featured items lead left, and a 0.46 card is capped by `maxImageHeight`.
- **Visual.** One element-scoped Playwright capture of the home grid with the setting on, saved to disk. Flag the file path for the owner; do not judge the look yourself.
- **Acceptance.** New and existing planner tests pass; setting off is byte-identical in plan output; the setting round-trips through export and import.

## WP-05 Detail layout chosen from the hero ratio

- **Goal.** A project page arranges hero media and copy according to the hero's ratio.
- **Depends on.** WP-03. **Behind a setting** `prem-detail-ratio-layout`, default off.
- **Read first.** `dist/card-renderer.js` (`function detail(`), `dist/image-frame.js` (the non-card branch), `dist/content-blocks.js`, `dist/page-blocks.js`, `tests/detail-*.mjs`, `tests/image-handoff.mjs`.
- **Rule.**

  | `cardRatio` | Width above 750px | Narrower |
  | --- | --- | --- |
  | 1.2 or more | media across the content rail, copy below in the reading column | media full width, copy below |
  | below 0.8 | two columns; media sticky, height capped to the viewport minus page chrome; copy scrolls | media capped at 70svh, centred |
  | otherwise | even two-column split | stacked |

- **Do.** Add a `data-detail-shape="wide|tall|square"` attribute in `detail()` from `cardRatio`, and stylesheet rules keyed on it. Thresholds and the 70svh cap are tokens in `tokens.css`, not literals. The card-to-page morph must end on the same ratio it started with; assert the start and end boxes have equal ratio (within 1%) in a test.
- **Do not.** Change `detail.columns` or block `layout` semantics.
- **Acceptance.** Tests for the three shapes; existing detail and handoff tests pass; one capture per shape on disk for the owner.

## WP-06 Asset roles are data, not naming

- **Goal.** Backdrops and per-file quirks are described on the asset record.
- **Read first.** Every hit of `-bg` in `scripts/`, `dist/backdrop-sources.js`, `scripts/image-freshness.mjs`, `scripts/optimise-images.py`, `scripts/build-backgrounds.mjs`, `dist/content/model.js`; `sourceCornerRadii` and `sourceEdgeInset` in `dist/image-frame.js`.
- **WP-06a Do.**
  1. Schema: optional `role` on an asset, enum `["backdrop"]`; optional integer `sourceCornerRadius` and `sourceEdgeInset`.
  2. One shared `isBackdrop(asset)`: `asset.role === 'backdrop' || asset.id.endsWith('-bg')`. Replace the three separate suffix checks (JavaScript and Python) with it, or with its Python twin plus a test that the two agree on every catalog asset.
  3. Move `tracr-transfer.jpg: 34` and the PlayStation 2px inset from `image-frame.js` into `assets.json`, read through the catalog. Rendered output must not change.
  4. Grep the repo-root docs for `-bg` and update the wording.
- **WP-06b (Blocked on D-3).** List the unreferenced files in `dist/assets/` with sizes; delete only what the owner approves.
- **Acceptance.** Existing image tests pass; a fixture asset with `role: "backdrop"` and an id that does not end in `-bg` is treated as a backdrop by every script.

## WP-07 Real URLs and prerendered pages (Blocked on D-2)

- **Goal.** Each published project, article and page has its own HTML file with correct metadata, and the site is discoverable by search engines, link previews and external AI readers.
- **Read first.** `scripts/build-worker.mjs`, `dist/index.html` head, `dist/app.js` hits for `location.hash` (about ten sites), `dist/project-route-aliases.js`, `vercel.json`, `deploy/node-server.mjs` `serveFile`.
- **WP-07a, static output only (no routing change).**
  1. New `scripts/build-pages.mjs`, run by `npm run build` after the content build. For each published `portfolio-item`, `article` and `page`, write `dist/client/<path>/index.html`: the app shell with a per-document `<title>`, `meta description`, canonical link, Open Graph and Twitter tags (image = the hero's largest generated variant, absolute URL), one JSON-LD block (`CreativeWork` for projects, `Article` for articles, `Person` on About), a `<base href="/">`, and the document's text rendered inside the app root as plain escaped HTML that the app replaces on boot.
  2. Each generated page carries a small inline script that sets the route for the app (`location.hash`) before `app.js` runs, so the existing router works unchanged.
  3. Also write `sitemap.xml`, `robots.txt`, `llms.txt` (site summary plus links) and `<path>.md` per document (title, facts, body text).
  4. Escape everything through the existing helpers in `dist/content/html.js`. JSON-LD is `JSON.stringify` output with `<` escaped.
- **WP-07b, History API routing (separate session, owner approval).** Replace hash reads and writes in `app.js` with path-based navigation; keep `#id` links working through `project-route-aliases.js`; add the Vercel rewrite and the same fallback in `node-server.mjs`.
- **Do not.** Start 07b in the same session as 07a. Hardcode the origin; read it from one config value.
- **Acceptance (07a).** A test builds pages for a fixture catalog and asserts title, canonical, Open Graph image and valid JSON-LD per page, and that drafts produce no file. Existing navigation tests pass unchanged.

## WP-08 Load by route

- **Goal.** A first visit to the home page does not download code for the Lab, 3D modes, assistant, voice, mascot or settings panels.
- **Read first.** Import statements at the top of `dist/app.js`; `dist/card-sphere.js`, `card-spiral.js`, `card-world.js`, `about-lab.js` (the modules that reach `vendor/three/three.module.js`); the two existing dynamic imports (`siri-wave.js`, the mascot embed) as the pattern to follow.
- **Do.**
  1. Add `scripts/module-graph.mjs`: walk static `import`/`export … from` specifiers from `dist/app.js`, print the module count, raw kilobytes and whether `vendor/three` is reachable. Add `tests/module-graph.mjs` asserting three.js is not statically reachable and the total is under a budget you set from the new measurement plus 5%.
  2. Convert the three.js consumers to `await import()` at the point of first use (entering a Lab 3D mode). Handle the failure path visibly: a failed import shows the existing toast and leaves the previous view; no empty catch.
  3. Repeat for the next largest route-only groups, one group per commit, re-measuring each time: assistant, voice and dictation, hand tracking, developer settings.
  4. Generate the `modulepreload` list for the remaining static graph into `index.html` at build time (in `build-worker.mjs`'s copy, not the authored file).
- **Do not.** Add a bundler. Change behaviour of any mode.
- **Acceptance.** `module-graph` test passes; report before and after numbers; Lab, assistant and settings tests pass; the browser tests that passed before still pass.

## WP-09 Caching

- **Goal.** Returning visitors revalidate cheaply and never re-download unchanged media.
- **Do first.** Record the live response headers for `site.css`, `app.js`, one optimised image and one video. If the site is not reachable from your environment, stop and ask the owner for them.
- **Do.** In `vercel.json`, add headers: `assets/optimised/*` and `assets/backgrounds/*` → `public, max-age=31536000, immutable` (their names already change with content, per MEDIA_ASSETS.md); HTML → `no-cache`; modules and CSS stay revalidating until file names are content-hashed. Mirror the same rules in `node-server.mjs`.
- **Do not.** Mark anything immutable whose name does not change when its content changes. Original media under `assets/` keeps the short lifetime.
- **Acceptance.** `tests/vercel-api.mjs` or a new test asserts the header rules; MEDIA_ASSETS.md notes that replacing an image under the same file name is no longer safe for generated copies.

## WP-10 The assistant reads everything a visitor can

- **Goal.** Articles, news and media descriptions reach the model; the corpus is cacheable.
- **Read first.** `worker/assistant-core.mjs` (`isSourceDocument`, `blockLines`, `usableDocuments`), `scripts/build-worker.mjs` (`assistantDocuments` filter and its field list), `worker/assistant-model.mjs` (`modelRequest`), `tests/assistant-sources.mjs`, `tests/assistant-api.mjs`, ASSISTANT.md.
- **Do.**
  1. Admit `article` and `news` in both `isSourceDocument` and the `assistantDocuments` type filter; carry `publishedAt`, `author` and `series` for articles.
  2. Schema: optional `description` (text) on an asset, meaning what the media shows. In `blockLines`, include an image or video block's `alt` and its asset's `description`. This needs the asset list available where blocks are flattened; pass a lookup in, do not import the client catalog into the worker.
  3. `modelRequest`: send the corpus as its own first message (`{sources: corpus}`), then the question and history in a second message, so the long, stable part is a cacheable prefix. Keep the response contract unchanged.
  4. Extend `tests/assistant-sources.mjs` so it fails if an article's body, a news item or an asset description stops reaching the model.
- **Do not.** Write the asset descriptions; that is the owner's content. Add a fixture description for tests only.
- **Acceptance.** Assistant tests pass; the built `dist/server/content.js` contains the two articles; ASSISTANT.md → "What the model can see" is updated in the same change.

## WP-11 Structured project facts (schema only)

- **Goal.** `portfolio-item` accepts structured facts; nothing rendered changes until the owner fills them.
- **Do.** Add optional fields with validation: `timeline {start, end}` (ISO year or year-month), `team {size, myRole, collaborators[]}`, `outcomes [{id, claim, metric?, evidenceId?}]`, `decisions [{id, problem, options[], choice, reason}]`, `tools[]`, `platforms[]`. Include them in the assistant record in `usableDocuments` and the `build-worker.mjs` field list. Add a fixture-based test.
- **Do not.** Invent values for real projects, or merge `capabilities`, `domains`, `disciplines` and `tags`; the vocabulary merge needs the owner's list first.
- **Acceptance.** A fixture project with all fields validates and reaches the model; a project with none is unchanged.

## WP-12 Knowledge moves into `content/`

- **Goal.** Profile facts and curated answers are validated content, not JavaScript in the served folder.
- **Read first.** `dist/knowledge/profile.js`, `dist/assistant-knowledge.js`, `sourceCorpus` in `worker/assistant-core.mjs`, `scripts/build-worker.mjs` copy steps.
- **Do.** Add `content/knowledge.json` (same record shape as today: `id`, `title`, `topic`, `text`, `route`, `tags`, `sourceIds`, plus curated answers and follow-ups). Validate it in `build-content.mjs` (every `sourceId` is a published document). Generate the two existing modules from it so every importer keeps working. Mark the generated files in AGENTS.md and the constitution's generated list.
- **Acceptance.** Generated modules are equal in exported values to the current ones (assert in a test before deleting nothing); an unknown `sourceId` fails the build.

## WP-13 Golden questions for the live model

- **Goal.** One command measures real answer quality.
- **Do.** `content/assistant-eval.json`: entries of `{question, mustCite[], mustNotClaim[], kind}`. `scripts/assistant-eval.mjs` calls `handleAssistantRequest` with the real environment, checks cited IDs, answer kind and forbidden phrases, and prints a pass table. It is not part of `npm run check` (it costs money and needs keys). Seed it with ten questions and mark them for the owner to review and extend to 30 or more.
- **Do not.** Read or print `.env` files. The script uses `process.env` only; the owner runs it with `--env-file`.
- **Acceptance.** Running without keys exits with a clear message and non-zero status; a mocked-provider test covers the scoring logic.

## WP-14 Token leak tests and duration tokens

- **Goal.** Colour, duration and font-size literals outside `tokens.css` cannot grow, and durations have CSS tokens.
- **Read first.** `tests/motion-tokens.mjs` (the pattern), `scripts/client-styles.mjs` (the stylesheet list), MOTION.md → Duration.
- **Do.**
  1. `tests/token-leaks.mjs`: over the authored stylesheets in `clientStyles` except `tokens.css`, count hex colours, literal `ms`/`s` durations and literal `font-size` values. Assert each count is at or below a recorded ceiling (measured on 2026-11-10 as roughly 74, 97 and 50; record the exact numbers you measure). The ceiling only goes down.
  2. Add `--duration-*` tokens to `tokens.css` for the roles in MOTION.md that are fixed values (hover in/out, press in/out, card content in/out, toast in/out, tooltip arrival, detail reveal), with JavaScript twins checked by the existing twin test where a module uses the same value.
  3. Replace literals with tokens where the value matches a role exactly. Leave anything that does not match and list it in the report.
- **Do not.** Change any value. Introduce `@layer` here; the cascade change is its own WP with visual tests as the gate.
- **Acceptance.** New test passes with lowered ceilings; `tests/motion-tokens.mjs` passes; no computed duration changes (spot-check five with a Playwright `getComputedStyle` read, as text).

## WP-15 Typography

- **WP-15a (not blocked).** Behind a setting `prem-type-floor`, default off: caption and note floors 12px; `--font-size-reading` resolves to 16px at Medium; `font-variant-numeric: tabular-nums` on years, metrics and times; lead the sans stack with `system-ui`. Replace literal font sizes with the nearest role token only where the value is equal. Captures on disk for the owner.
- **WP-15b (Blocked on D-4).** Self-hosted variable font with `font-display: swap` and a metric-matched fallback; scale defined in `rem`.

## WP-16 Specimen page (Blocked on D-5 for scope)

- **Goal.** A `#system` route renders each component from tokens with worst-case content, and browser tests target it.
- **Do.** Follow ADR-011 (in-app route, `index.html` only). Reuse `card-renderer.js` and the block renderers with fixture documents: long title, no media, ratios 0.46 and 2.33, missing optional fields. One element-scoped visual test per component.
- **Acceptance.** The route renders with zero console errors; each component has a baseline; no existing page changes.

## WP-17 Motion performance

Each item is its own session and starts with a measurement taken inside the page (a single-process Playwright script), reported as numbers.

1. **Layout-animating rules.** Find the two `will-change` declarations naming `width, height, left, top` and the transitions naming layout properties. For each, report what it animates and whether a transform or clip-path version is feasible. Change only those the owner picks.
2. **Blur budget.** Count elements with a non-`none` computed `backdrop-filter` in the viewport on home, a project page and the assistant. Report the counts. Propose, do not apply, a cap.
3. **WebGL contexts.** Count live contexts with all home cards mounted, in each home layout. If the count scales with cards, report it with the module that creates them.
4. **Stage reveal.** `dist/feature-stage-reveal.js` resets a stage that leaves the screen so it replays. Behind a setting, play once per visit.

## WP-18 Format and move source (Blocked on D-6)

Not specified further until the owner decides. It touches every file and must be the only change in its commit.

---

## Stop conditions for every WP

Stop and report in three lines or fewer if: a step needs a new dependency; a file you must edit has uncommitted owner changes that overlap your lines; a test fails that this brief does not mention and you cannot tie to your change; a measurement in this brief does not match what you find; you meet a credential; or the WP's acceptance cannot be met without touching files outside its list.
