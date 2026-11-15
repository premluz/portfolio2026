---
title: Verified facts
type: facts
status: active
owner: Prem
updated: 2026-10-26
summary: Findings measured or observed in this project, with their source and date; they are evidence, not requirements.
tags: [area/docs, area/images, area/tooling]
related: [MEDIA_ASSETS.md]
---
# Verified facts

A fact states what was observed, where, and when. If it may have changed, re-check it and update `Verified` or set its status to `stale`.

## FACT-001 Chromium cannot decode images above about 55 megapixels
- Status: verified
- Source: headless Chromium via Playwright, `Image.decode()` on resampled copies of a backdrop export
- Verified: 2026-10-26
- Tags: area/images, area/tooling

13000×4250 decodes; 14000×4575 and the 16544×5408 original do not. `scripts/build-backgrounds.mjs` scales oversized exports under this limit before cropping them.

## FACT-002 macOS `sips` ignores `--cropOffset`
- Status: verified
- Source: cropped the same export with both offset argument orders; both returned the centre of the image
- Verified: 2026-10-26
- Tags: area/images, area/tooling

`sips` crops around the centre. Cropping a top-left frame is therefore done on a canvas in headless Chromium; `sips` only resizes.

## FACT-003 A file moved in Finder keeps its old modified date
- Status: verified
- Source: `dist/assets/bastion.png` showed Oct 13 after the owner replaced it, while its content differed from the copies generated on Oct 22
- Verified: 2026-10-26
- Tags: area/images

Modified times cannot show that an original was replaced; compare checksums. See [ADR-001](decisions/ADR-001-generated-images-are-committed-and-checked.md).

## FACT-004 The local server never caches; production caching was not verified
- Status: verified
- Source: `deploy/node-server.mjs` sends `cache-control: no-store` for local requests; `curl` against localhost:3000 confirmed it. `portfolio2026.vercel.app` returned HTTP 500 on 2026-10-26, so its asset headers were not measured
- Verified: 2026-10-26
- Tags: area/deploy, area/images

A hard refresh cannot matter locally. For production, the cache lifetime of an unchanged filename is unknown; the media guide recommends a new filename when replacing a published asset.

## FACT-005 A CSS scroll-driven animation overrides a transition on the same property
- Status: verified
- Source: after adding `animation-timeline: view()` to the stage cards, the backdrop's own scale transition stopped playing in the browser
- Verified: 2026-10-26
- Tags: area/motion, area/home

This is why the stage reveal uses timed transitions toggled by an observer. See [ADR-003](decisions/ADR-003-stage-reveal-uses-an-observer.md).

## FACT-006 One invalid catalog value stops the whole content build
- Status: verified
- Source: Bastion's card orientation was mistyped as `portraitwh`; `scripts/build-content.mjs` failed validation, the site kept serving the previous build (landscape card, old video), while `npm run dev` read the catalog directly
- Verified: 2026-10-26
- Tags: area/content, area/deploy

A missing local file (for example a misspelled `playstation-bg.jpg`) fails the same way, in either content set.

## FACT-007 Simple transitions rebuild the home page, so images were fetched again
- Status: verified
- Source: with 250ms simulated latency and Vercel-style `max-age=0, must-revalidate` headers, two of three visible home images were requested again on return and appeared after the fade-in; with `MediaLoader` holding one `Image` per loaded URL, all were ready in about 10ms with no requests
- Verified: 2026-10-26
- Tags: area/home, area/images, area/motion

## FACT-009 A running dev server keeps the old content model after you change it
- Status: verified
- Source: after adding `homeCards` to the schema, a dev server started earlier kept validating with the old model (`additionalProperties: false`), returned 500 for `/content/catalog.js`, and the page rendered nothing. Restarting it fixed it
- Verified: 2026-10-26
- Tags: area/content, area/tooling

`npm run dev` reloads the catalog on each request but not the JavaScript modules it validates with. After editing `dist/content/model.js` or `provider.js`, restart the server (and `npm run build` for the :3000 copy).

## FACT-010 An absolutely positioned grid child with `grid-row: 1` runs to the container's edge
- Status: verified
- Source: the stage backdrop with `grid-row:1` covered the whole card; probing insets showed its containing block ended at the padding edge; `grid-row:1/2` confined it to the first row
- Verified: 2026-10-26
- Tags: area/home

For an abspos item, an `auto` end line means the container's padding edge, not "span one track". Give both lines.

## FACT-011 A time-only cache-busting query can return a stale module
- Status: verified
- Source: `scripts/image-freshness.mjs` imported `image-variants.js?<Date.now()>`; two imports within the same millisecond reused the first module, and tests/image-freshness.mjs failed intermittently (3 of 25 runs before the fix, 0 of 25 after adding a counter)
- Verified: 2026-10-26
- Tags: area/tooling, area/tests

When code re-imports a rewritten file, make each URL unique with a counter as well as the time.

## FACT-012 Without `--dev`, the Node server serves the last build, not the sources
- Status: verified
- Source: WP-17 item 1 (TASK-056). After an edit to `dist/project-menu-preview.js`, `node deploy/node-server.mjs` still served the old module from `dist/client/`: the preview's inline `translate` was empty. With `--dev` the edit was live.
- Verified: 2026-11-15
- Tags: area/tooling, area/tests

Measure or test edited sources with `--dev`, or run `npm run build` first. A before/after comparison is only valid when both runs use the same server mode.

## FACT-013 Presetting localStorage before the first load does not set the page's settings
- Status: verified
- Source: WP-17 item 3 (TASK-058). Keys seeded with `addInitScript` on a fresh browser profile were overwritten at boot. The published settings import over storage until `prem-site-settings-revision` matches (site-settings.js), retired keys such as `prem-home-view` and `prem-image-*-enabled` are reset once (default-settings.js), and the product display follows `dataset.pageProductDisplay`. Every layout measured as the default until the script checked the settings selects.
- Verified: 2026-11-15
- Tags: area/tooling, area/tests

To put a page in a given state, boot it once, then either change the settings controls (dispatch `change`) or write storage and reload. Afterwards, assert the state the page reports, not the state you asked for.

## FACT-008 Hunk-staging a file shared with unfinished work can commit half of a change
- Status: verified
- Source: committing the card-details work while the owner's agent feature touched the same files; a moved pair of lines in tokens.css staged only its removal (the dark gradient values vanished from HEAD), and a hand-staged site.css no longer matched its sources. A clean `git worktree` of HEAD running the tests caught both
- Verified: 2026-10-26
- Tags: area/tooling, area/deploy

When a file mixes your change with unfinished work, build the staged version from HEAD plus only your lines (or regenerate a generated file from the committed sources), then run the tests in a clean worktree of the new HEAD before calling the commit done.
