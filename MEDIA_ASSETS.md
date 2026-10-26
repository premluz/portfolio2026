---
title: Media and image assets
type: ops
status: active
owner: Prem
updated: 2026-10-26
summary: How to add or replace images and video, regenerate copies, backdrops, and why an old image can still show.
tags: [area/images, area/content]
related: [CONTENT_MODEL.md, ADR-001, ADR-002]
---
# Replacing project images and videos

Run commands from the `portfolio2026` repository root. The authored catalog is
`content/catalog.json`; files under `dist/content/`, `dist/server/` and
`dist/client/` are generated output, not independent configuration.

For local editing, run `npm run dev`, save changes and reload the browser. Catalog
and authored files are served directly; a deployment build is not required for
local text, orientation or media-reference changes. The build instructions below
prepare production output. Responsive image regeneration is still needed after
replacing originals that already have optimized variants.

## 1. Add the media and update its references

Put originals in `dist/assets/`. Prefer a new filename when replacing a published
asset, such as `rios-landscape-v2.png` and `rios-landscape-v2.mp4`. A new filename
also gives generated WebP copies new URLs, avoiding old browser/CDN cache entries.

In `content/catalog.json`, update the matching asset entries:

```json
{"id":"rios-cover","type":"image","status":"published","url":"assets/rios-landscape-v2.png","alt":"Rios planning interface"}
{"id":"rios-walkthrough","type":"video","status":"published","url":"assets/rios-landscape-v2.mp4","alt":""}
```

These are separate entries in the `assets` array. Keep their stable IDs so
`heroMediaId`, `hoverVideoId`, `mediaId` and `posterMediaId` references still work.
If an entry already has `width` and `height`, update them to the new dimensions.
Use matching poster/video proportions for a seamless hover handoff; for example,
both exports can be 1440 × 900. Orientation does not rotate an image or remove
padding embedded in the exported pixels.

## 2. Set the card orientation

Find the project's entry in `presentations`, not a carousel's scroll direction:

```json
"documentId": "rios",
"card": {
  "orientation": "landscape"
}
```

Change only `card.orientation`; preserve the other card/detail properties.
Use `portrait` for vertical media. All placements referencing the same document
share this presentation setting, including the duplicate `rios-02` card.

## 3. Regenerate images, then build and test

```sh
npm run images &&
npm run build &&
npm run check
```

`npm run images` runs two generators, locally, with the project's Python/Pillow
tooling and macOS `sips`:

- `scripts/optimise-images.py` regenerates responsive WebP files in
  `dist/assets/optimised/`, verifies each encoded image, and rewrites
  `dist/image-variants.js` with source dimensions, a checksum of the original and
  the variant URLs.
- `scripts/build-backgrounds.mjs` makes web copies of project backdrops (every
  asset whose id ends in `-bg`) in `dist/assets/backgrounds/`, cropping a whole
  design-canvas export to its photo frame first, and records each original's
  checksum in `dist/assets/backgrounds/sources.json`.

Run it after any image replacement, including one that keeps the same filename.
Image URLs should be plain local paths; use versioned filenames instead of query
strings for images.

`npm run build` and `npm run check` first run `npm run check:images`, which
compares every catalog image's checksum with the one recorded when its copies
were made. A replaced original, a new image nobody processed, or a missing copy
stops the build and names the image. The check is plain Node, so it also runs on
the deployment build, where the generators themselves cannot. Checksums are used
because a file moved in Finder keeps its old modified date.

`npm run build` then validates catalog references and required local assets and
regenerates the browser catalog, assistant content and served `dist/client/`
directory. It does **not** run the generators. Stop on a failed command; do not
treat a failed build or check as a successful release.

## 4. Publish the complete change

Include the catalog changes, new originals, generated WebP copies,
`dist/image-variants.js`, the backdrop copies and `dist/assets/backgrounds/sources.json`,
and relevant tracked build output in the same release.
Do not include unrelated local edits. Push the reviewed commit to `main` for the
connected Vercel deployment; a local build alone does not update the live site.
Do not remove old originals or generated files as part of this process unless
their deletion is separately intended and approved.

## Project backdrops

A backdrop is an image asset whose id ends in `-bg` (for example `merlin-bg`, `generic-bg`). Put the original in `dist/assets/` and run `npm run images`. Link it from the project's presentation with `card.backgroundMediaId`; projects without a link use `generic-bg`.

- **Export just the photo.** The script writes 1920px and 3840px copies to `dist/assets/backgrounds/` (it never overwrites originals). If an export is a whole design canvas, with the photo at the top-left of a large white board, the script finds the photo frame and crops to it, trimming a few pixels from every edge. A photo-only export is detected as such and used whole. Larger exports give sharper full-screen backgrounds: copies are never upscaled beyond the photo's own width.
- **The filename must match the catalog.** `scripts/build-content.mjs` stops on any missing local file, so a typo such as `plastation-bg.jpg` blocks the whole build.
- **Originals are large.** Canvas exports can be 16,000px wide; Chromium cannot decode images above roughly 55 megapixels, so the script scales those down before cropping.
- **Copies are committed.** Commit `dist/assets/backgrounds/` (including `sources.json`, which records each original's checksum) with the originals.## Why an image can still look portrait or inset

- **Orientation still reads `portrait`:** the saved canonical catalog controls
  the result; edits to generated copies are overwritten by the next build.
- **New original, old image on screen:** `imageMarkup` and `posterSource` select
  responsive WebP copies through `dist/image-variants.js`. Rebuilding without
  running `npm run images` used to serve the previous image silently; the build
  now stops and names the stale image instead.
- **Old playback at the same URL:** replacing a video without changing its URL
  can reuse cached media. A new filename gives the replacement a fresh URL.
- **Landscape card with empty space:** images and videos preserve their source
  proportions. Letterboxing and padding baked into the asset are different from
  CSS padding; changing orientation does not crop the artwork.
- **Hero versus other cards:** hero carousel media cards have zero inner card
  padding. Other galleries and text cards retain their normal spacing. Carousel
  centering space and gaps between cards remain intentional.
