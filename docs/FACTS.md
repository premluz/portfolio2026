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
