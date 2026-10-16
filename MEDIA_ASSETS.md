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
python3 scripts/optimise-images.py &&
npm run build &&
npm run check
```

The image generator uses the project's existing Python/Pillow tooling. It
regenerates responsive WebP files in `dist/assets/optimised/`, verifies each
encoded image, and rewrites `dist/image-variants.js` with source dimensions and
variant URLs. Run it after image replacements, including replacements that keep
the same filename. Image URLs should be plain local paths for this generator;
use versioned filenames instead of query strings for images.

`npm run build` validates catalog references and required local assets, then
regenerates the browser catalog, assistant content and served `dist/client/`
directory. It does **not** run the image optimizer. Stop on a failed command;
do not treat a failed build or check as a successful release.

## 4. Publish the complete change

Include the catalog changes, new originals, generated WebP copies,
`dist/image-variants.js`, and relevant tracked build output in the same release.
Do not include unrelated local edits. Push the reviewed commit to `main` for the
connected Vercel deployment; a local build alone does not update the live site.
Do not remove old originals or generated files as part of this process unless
their deletion is separately intended and approved.

## Why an image can still look portrait or inset

- **Orientation still reads `portrait`:** the saved canonical catalog controls
  the result; edits to generated copies are overwritten by the next build.
- **New original, old image on screen:** `imageMarkup` and `posterSource` select
  responsive WebP copies through `dist/image-variants.js`. Rebuilding without
  regenerating those copies can still serve the previous portrait image.
- **Old playback at the same URL:** replacing a video without changing its URL
  can reuse cached media. A new filename gives the replacement a fresh URL.
- **Landscape card with empty space:** images and videos preserve their source
  proportions. Letterboxing and padding baked into the asset are different from
  CSS padding; changing orientation does not crop the artwork.
- **Hero versus other cards:** hero carousel media cards have zero inner card
  padding. Other galleries and text cards retain their normal spacing. Carousel
  centering space and gaps between cards remain intentional.
