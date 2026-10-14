# Content model

The model is independent of CMS, storage, interaction and layout. The live site
currently uses an embedded public snapshot; no external CMS or AI service is connected.

## Names and responsibilities

| Concept | Meaning | Examples |
| --- | --- | --- |
| Document type | Schema for a standalone entity | `portfolio-item`, `page`, `news`, `component` |
| Document | An instance with a stable ID, publication status and content | PlayStation project, About, home introduction |
| Block type | Schema for a piece of document content | `text`, `image`, `video`, `info-card`, `carousel`, `reference`, `metric`, `quote` |
| Block | An ordered, typed instance inside a document | A result card or a carousel containing project references |
| Component document | Independently maintained, reusable content | Footer invitation or a shared carousel |
| Asset | Media identity and metadata | Image/video URL, alt text, optional dimensions and credit |
| Presentation | Display preferences separate from authored copy | Card orientation/colours and 1–4 detail columns |
| Placement | A document reference in a particular layout | A featured card or another appearance of the same project |

“Content type” is often an umbrella term. Here, document types and block types
are explicit: a carousel is usually a block. Save it as a `component` document
when several documents need to share the same authored carousel, then embed it
using an inline reference. Schema definitions are shared code; component documents
are shared content. Blocks do not own independent page routes.

## Source and public export

Edit `content/catalog.json`. `node scripts/build-content.mjs` validates it and
checks local media, then generates:

- `dist/content/catalog.js`: embedded browser snapshot.
- `dist/content/catalog.json`: public JSON catalog for future integrations.
- `dist/content/schema.json`: JSON Schema 2020-12 contract.
- `dist/content/index.json`: lightweight metadata index for retrieval.
- `dist/content/response.schema.json`: typed answer contract.

These files are generated; do not edit them independently. `--check` detects
stale generated content. `node scripts/check.mjs` runs that check and the suite.
Draft and archived documents/assets are excluded from public exports. Authored
records, including drafts, must satisfy the contract. Published documents cannot
reference draft/archived documents or media. Content under `dist` is public.

Schema version 1 requires stable IDs; rejects unknown fields/types, duplicate
IDs/slugs, unsafe URLs, incorrect/missing media and document references; and
limits nesting. Blocks have document-local unique IDs. Evidence IDs are scoped
to their document. Inline references cannot cycle; card links can reference each
other because rendering a card does not recursively expand its detail blocks.
Breaking changes require an explicit schema version and migration.

## Composition examples

Add this block to a document's `blocks` array:

```json
{
  "id": "related-work",
  "type": "carousel",
  "title": "Related work",
  "layout": { "span": 2 },
  "items": [
    { "id": "sony-card", "type": "reference", "documentId": "playstation", "presentation": "card" },
    { "id": "tracr-card", "type": "reference", "documentId": "tracr", "presentation": "card" },
    { "id": "note", "type": "info-card", "title": "Implementation matters", "paragraphs": ["Design close to the system."] }
  ]
}
```

For reuse, put the same block in a published `component` document with its own
ID/title, then use:

```json
{ "id": "shared-work", "type": "reference", "documentId": "shared-carousel", "presentation": "inline" }
```

`image`/`video` blocks reference `mediaId`, not copied URLs. An image can override
asset alt text for its specific context. Metric/quote blocks require nonempty
`evidenceIds` referencing document evidence. Evidence records preserve statements
and provenance (`author-provided` or `source-linked`). Existing project claims
were retained as author-provided content; they have not been independently verified.

## Case-study pane layout

Each block is also a pane in the case-study canvas. Its optional `layout` keeps
the controls local to that pane:

```json
{
  "id": "galachain-block-1",
  "type": "image",
  "label": "01 / Exchange",
  "title": "Trading with fewer barriers.",
  "mediaId": "galachain-dex",
  "layout": { "columns": 2, "mediaFit": "max-side" }
}
```

`columns` is `1` or `2` (two columns is the default canvas width). On mobile,
both spans become full width. `mediaFit` applies to image and video panes:

| Value | Presentation |
| --- | --- |
| `max-side` | Keep the complete media at its natural ratio, bounded by pane width and viewport height. |
| `contain` | Centre the complete media inside the pane's media frame. |
| `full-bleed` | Fill the pane width edge-to-edge and crop to its frame. |

Labels use the shared quiet eyebrow style. These fields are ordinary block data,
so an editor or CMS can expose the same small set of choices without changing
the renderer or adding a project-specific content type.

## Canonical identity and existing motion

The seven portfolio documents are stored once. The eleven project cards are layout
placements, including the four existing `-02` placement IDs. Their routes and DOM
identity remain stable so retained-home, Escape, image effects and shared-title
transitions keep working. A document's `featured` flag is the editorial default;
a placement can override it for a particular layout. `kind: shipped | lab` belongs
to the project and drives grouping.

`dist/documents.js` projects canonical data into the existing renderer shape;
this is a compatibility view, not another source of content. News remains outside
the project carousel. Home and footer content also comes from documents.

## CMS adapters

`dist/content/provider.js` exposes an immutable content store and an asynchronous
provider boundary:

```js
const provider = createContentProvider({
  load: async ({ signal }) => adaptCmsExport(await readCms({ signal }))
});
const store = await provider.load();
store.get('playstation');
store.list({ type: 'portfolio-item', kind: 'shipped' });
store.getCard('playstation');
store.getLayoutCards('home');
```

`load` normalizes the CMS output to the canonical catalog. It can read Markdown
frontmatter from Obsidian, an API, a database, or an export. Provider loads share
one pending request; refresh validates a complete new snapshot before swapping it.
A failed or aborted refresh leaves the last valid snapshot intact. HTTP providers
accept a custom fetch implementation and an `adapt` function.

For this site's synchronous initial render, a build-time CMS adapter is the
simplest connection: write the normalized catalog and run the same generator.
A runtime CMS connection instead needs an awaited bootstrap and passing the loaded
store to consumers. It does not require changing document/block schemas or the
liquid motion system. CMS credentials and private records belong outside the
public browser bundle; a public endpoint should only expose publishable content.

## Retrieval and AI answers

```js
store.search({ query: 'publishing workflow', type: 'portfolio-item', limit: 5 });
const answer = {
  type: 'mixed',
  text: 'Relevant publishing experience.',
  documentIds: ['playstation'],
  citations: [{ documentId: 'playstation', evidenceId: 'highlights' }]
};
store.resolveAnswer(answer);
contentAnswer(answer, { store });
```

Search is deterministic token matching with title/alias weighting, controlled
filters and bounded pagination. It searches canonical records, so placement
copies never create duplicate results. It is a baseline retriever, not semantic
search. A future server can use the same records for embeddings/hybrid retrieval.

Answer types are `cards`, `text` and `mixed`. The boundary rejects invented IDs,
unknown evidence, unavailable cards and arbitrary HTML. Cards resolve through
the shared card renderer and real routes. Text is escaped; citation IDs resolve
to stored evidence and project links. Validation establishes structural/reference
integrity, not factual correctness: a future AI service must restrict its context
to retrieved public content and evaluate answer grounding separately. No model,
API key, chat interface or generation service was added by this migration.

## Adding types

Use `createContentModel({ documentTypes, blockTypes })` to register new schema
fragments (properties, required fields, optional semantic validation hook), and
`createBlockRenderer({ store, renderers })` to register matching block renderers.
The model exports standard JSON Schema; its small runtime validator supports the
explicitly documented keyword subset in `schema-validator.js` and rejects
unsupported extension keywords rather than ignoring them.

Shared identity fields and built-in types cannot be overwritten by an extension.
A new document type also needs an appropriate page/card template and route
registration if it should be navigable. A new block type needs a renderer.
Unknown render types show an unavailable-content message instead of injecting
raw markup. Existing readers receive only public validated snapshots by default.

### Hero timeline

The homepage document includes a `timeline` block with an ordered `items` array of typed content blocks. Add, remove or reorder those items in `content/catalog.json`, keeping each item ID stable. Text items use `paragraphs`; info cards can also supply a safe `link`. The hero renderer displays this sequence on a horizontal rail. Interaction preferences belong to the presentation layer, not the content document. Run `node scripts/build-content.mjs` after content edits.

## Project prototype metadata

Each portfolio document separates `title` (the card headline) from `pageTitle`
(the case-study thesis), and can provide a longer `intro` plus standalone
`context`, `challenge`, `role`, `keyWork` and `impact` fields. The card uses its
outcome-led title and proof-line `summary`; the detail renderer presents the
case-study fields in that order. Optional `challenge`, `intro` and `pageTitle`
keep older records compatible while new records use the full rhythm.

Each portfolio document has a `prototype` object in `content/catalog.json`.
`label` controls its button text; optional `url` is the HTTP(S) address of the
interactive prototype. Do not put credentials or private URLs in this public content.

```json
"prototype": {
  "label": "View prototype",
  "url": "https://example.com/prototype"
}
```

Actual project URLs have not been supplied yet. Until a URL is configured,
View prototype expands the project image using the same reversible transition
as View full screen. With a URL configured, its iframe loads after expansion;
the host must permit embedding. The separate full-screen icon is controlled by
Show full screen option under developer settings → Project details. Both controls
follow the site theme, motion preference and transition duration. Escape closes
the focused view before returning from the project page.


## Content widths and section breakouts

Home and project details have independent Small (1200px), Medium (1440px) and Large (1760px) content rails. These are maximum inner content widths. Responsive side gutters are added outside the rail; the entire app canvas, including those gutters, never exceeds 1920px. Medium is the default. All ordinary sections, portfolio cards, detail content and the footer follow the active rail.

The width definitions and migration of previous full-width preferences live in `dist/content-widths.js`. Layout styles live in `dist/content-widths.css`. The active geometry uses the browser client width so a scrollbar cannot create horizontal overflow.

A full section can override its rail with a presentation attribute:

```html
<section data-content-span="content">Ordinary content rail</section>
<section data-content-span="app">App width, retaining the side gutters</section>
<section data-content-span="edge">App width, ignoring the side gutters</section>
```

Apply breakouts to section containers within a centred content rail, rather than an individual item inside a sidebar or grid column. `content-bleed` and `content-bleed-edge` are equivalent CSS utilities for app and edge modes. This system works for homepage sections and future sections on project pages; it does not alter image fitting or the padding inside individual cards.

Dev settings → Content exposes the three section modes for Services, About, Experience and Testimonials. Visibility and width are independent. Section spans persist under `prem-home-section-spans`; home and project width selections persist separately under `prem-home-content-width` and `prem-detail-content-width`. A layout change retains the existing card canvas and supports reversing its transition with Escape.


## Reusable spatial card gallery

`card-gallery` is a standalone content block, independent of homepage Flip. Its items can be any registered blocks, including project references, image cards and text cards. `title` and `description` are optional; `orientation` is `horizontal` or `vertical`; `variant` is `perspective` (native scroll track) or `circular` (cylinder placement). The active item’s customer, title and summary appear beneath the gallery. Several neighbouring items remain visible in perspective.

```json
{
  "id": "home-projects",
  "type": "card-gallery",
  "title": "Selected work",
  "orientation": "horizontal",
  "variant": "circular",
  "layout": { "columns": 2 },
  "items": [
    { "id": "gallery-tracr", "type": "reference", "documentId": "tracr", "presentation": "card" }
  ]
}
```

`cardGalleryMarkup(block, {store, render})` supplies reusable markup; `new CardGallery(element, {reduced})` mounts its independent controller. Call `setOrientation()` to change axes, `setVariant()` to switch presentation without replacing cards, and `destroy()` when removing it. Native touch scrolling, mouse drag, arrow buttons, keyboard arrows and Home/End select cards. Enter opens the centred interactive card. Reduced motion removes perspective and caption animation. The homepage instance defaults to Circular. Developer settings → Layout → Product display switches between the Cards layout and this Carousel, with Carousel as the default. About now uses an `about-timeline` block instead of the project gallery. Its presentation and orientation are exposed in Developer settings → Content, persist in browser storage, and are included in settings exports. Circular supports wrapping arrows, keyboard navigation, touch/mouse dragging and horizontal trackpad input. Its placement adapter (`circular-card-gallery.js`) computes pitch from each card’s width, so landscape cards are substantially wider than portrait cards in both variants. The front card remains face-on at full size. A wide front arc uses the full viewport as its perimeter; neighbours extend towards and beyond its edges. Cards fade out at the wrap seam, and back faces remain hidden. It retains the shared card/image renderers and does no idle rendering. Reduced motion uses the native scroll variant instead. The two presentations share responsive sizing tokens (`--gallery-landscape-width`, `--gallery-portrait-width`, `--gallery-card-height`). Both gallery variants use `GalleryExtrusion` for a shallow titanium side wall. It follows the exact fitted image bounds and radius when backgrounds are hidden, or the outer card when backgrounds are visible. Angle-driven transforms reveal only the side material, with physical outward-facing walls extending behind the screen and hidden backfaces. Light/dark material tokens are `--gallery-metal-shadow`, `--gallery-metal-mid`, `--gallery-metal-light`, and `--gallery-metal-shine`. No image is cloned, no new GPU context is created, and there is no idle animation loop. Reduced motion removes the extrusion.


### Services and testimonials

`servicesMarkup(document, {id, layout})` and `testimonialsMarkup(document, {id, cardBackground})` render standalone section components from their existing component documents. Pass a unique `id` when using multiple instances. They have no homepage placement dependency; their homepage wrappers add only the section visibility marker. Services supports `grid` or `carousel` and defaults to carousel on the homepage. Background-free testimonials remove panel fill, border and padding, and use the body typography tokens, with larger gaps between quotes.

`CardRail` provides reusable native horizontal scrolling, snap points, arrow controls, keyboard navigation, reduced motion and disposal for flat card collections. A rail uses `data-card-rail-viewport`, `data-card-rail-previous` and `data-card-rail-next` hooks. Its `data-card-rail-mode` can switch between `grid` and `carousel` without remounting or replacing cards. The Developer settings → Content preferences persist and are included in JSON presets.


### Page template width presets and carousel alignment

Home, project details and content pages (About / Contact) each have an independent Small (1200px), Medium (1440px) or Large (1760px) content width. These are grouped under Developer settings → Layout → Page template widths. Storage keys are `prem-home-content-width`, `prem-detail-content-width`, and `prem-content-page-width`. Every template shares the 1920px app cap and responsive global side gutter. `pageTemplateForRoute()` selects the template; `--content-rail-width` exposes the resolved content size.

Services carousel alignment is independent of its section width. Full bleed starts the first card at the global side gutter; Content alignment starts it at the current template’s content edge. Both keep an app-wide scrolling track. The selection persists under `prem-services-carousel-alignment` and travels in settings exports. A standalone `servicesMarkup` instance accepts `carouselAlignment: "full-bleed" | "content"`.
