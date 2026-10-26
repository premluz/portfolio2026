---
title: Design system
type: spec
status: active
owner: Prem
updated: 2026-10-26
summary: Tokens, type scale, mono text, glass surfaces and card/media rules.
tags: [area/design-system]
related: [FRAMEWORK.md, MOTION.md]
---
# Portfolio design system

`dist/tokens.css` owns the foundation tokens. `dist/design-system.css` maps them
to the interface. Text size, spacing, letter spacing and line spacing offer
Small / Medium / Large presets. Header and body weight are independent and each
offers Thin (300), Regular (400) and Bold (500). Defaults are Medium size and
spacing, with Regular weight. Settings persist locally through
`dist/design-system.js`; existing shared text-weight settings migrate to both
new weight controls.

| Control | Root attribute | Tokens |
| --- | --- | --- |
| Text size | `data-type-size` | `--type-scale`, semantic `--font-size-*` roles |
| Spacing | `data-space-size` | `--space-density`, 4px spacing scale, semantic gaps |
| Header weight | `data-heading-weight` | `--font-weight-heading` |
| Body weight | `data-body-weight` | `--font-weight-body` |
| Letter spacing | `data-type-tracking` | heading, card, body and label tracking |
| Line spacing | `data-type-leading` | heading, card, body, reading and label leading |

The Medium composition uses a native system sans, regular headings and body,
a restrained
type scale, 66-character reading measures and a 4px spacing unit. Home and detail
headings share size, weight, tracking and leading. Labels sit close to titles;
larger gaps separate content sections. Small and Large vary one axis at a time.

Navigation uses the same eyebrow scale for quiet inactive labels and utility
icons. `--nav-item-hover` is the lighter interaction wash; `--nav-active` is a
slightly denser selected surface, with both values adapted to light and dark
themes. The bottom liquid dock uses its own `--dock-outline` token so its
perimeter stays much quieter than the glass fill and reflections; its outline
does not add a second drop shadow.

Project details use an unlabeled three-sentence context introduction, followed
by Role, Highlights and Key work. `--space-detail-context` separates it from
the shared summary; `--space-detail-sections` separates the introduction from
the project facts. Both default to 32px and follow the spacing preset.

Temporary navigation layers live in fixed `.motion-viewport` containers with
paint containment. Their retained pages, morphs and offscreen motion cannot
increase document scroll bounds. The live page clips displaced cards during
route changes; touch devices suppress scrollbar indicators for that interval.
Normal vertical scrolling remains available, and horizontal page overflow is
clipped without creating a nested scroller.

Card title size, image padding, card gap, card rounding and page-edge sliders
remain independent fine adjustments. Preset changes remeasure the current layout
and images without replacing card nodes. Changes are held while a card transition
is active. Hover physics, theme palettes and glass materials are unchanged.

Image size presets have been removed. Landscape images use a fixed maximum
width of 1000px and align to the card text edge. Portrait images use a maximum
width of 600px and maximum height of 700px, centred in their holding frame.
Detail frames follow the source ratio and stop at the same cap as the image, so
unused vertical space is not left above or below it. All images preserve their
source ratio and fit within the available container. The still, hover video,
edge and liquid canvas share the same bounds. Image padding defaults to zero;
the padding sliders remain available for intentional spacing. Masonry includes
the image frame in its placement height.

Nested card shapes follow `inner radius = max(0, outer radius − padding)`.
The card's computed rounding and smallest configured inset define the holding
frame; full-bleed frames share the outer radius. Image padding is subtracted
once more for the screenshot. Letterbox space does not count as padding, so
centred portraits retain their rounding. The image, its single subtle edge and
the liquid canvas share these bounds and radius, including during morphs and
Escape reversals. Image radii are clamped to half the shortest image dimension.

Image corner rounding is a separate `--image-rounding` control, defaulting to
6px with a persisted 0–32px slider. It directly controls screenshot rounding,
independent of card rounding and padding. The holding frame's background keeps
its nested radius, while native screenshots, their subtle edges and liquid masks
share the selected image radius. The holding frame does not clip these elements
again, including in full-bleed mode and detached transition frames. Screenshot
radii are clamped only to half the shortest image dimension.

The supplied Tracr JPEG has white matte corners baked into its source. Its
34px source corner mask scales with the fitted image and provides a minimum
radius for that asset alone. Native images, video previews, hairlines and liquid
masks share it, including cloned motion frames. Other images keep the exact
rounding slider value; larger selected radii still apply to Tracr.

Portfolio documents can include an optional `videoUrl`, for example
`videoUrl: 'assets/sony-content-pipeline.mp4'`. The shared card/detail renderer
keeps the image as the still poster and adds a native muted, looping video over
it. A relative asset path or hosted video URL works. The source is assigned only
on hover (or keyboard focus on a device supporting hover); no idle preload or
WebGL video renderer is added. Both media keep their source proportions and
share image padding and rounding. Leaving the card restores the image; entering
again restarts the preview. Navigation, dragging, hidden tabs and disposal pause
playback. Motion snapshots omit video elements, and reduced-motion preferences
keep the still image. Only one hover preview plays at a time.

## Type scale, mono text and spacing tokens

**Text size** (Small / Medium / Large in Type and spacing) sets two root variables. `--type-scale` scales body and small text; `--heading-scale` scales hero, section and footer headings, so headings can be much smaller than body proportions alone would make them. Medium is the default.

| Text size | `--type-scale` | `--heading-scale` | Body | Hero heading at 1440px |
| --- | --- | --- | --- | --- |
| Small | .82 | .6 | 13.1px | 24.7px |
| Medium | .9 | .68 | 14.4px | 28px |
| Large | 1 | .78 | 16px | 32.1px |

The body floor is 13px. The project detail and footer headings share the hero size.

**Gradient text role.** `.text-gradient` is a reusable two-stop tint (`--text-gradient-from` / `--text-gradient-to`, with light and dark values in `tokens.css`). The About page's `.about-highlight` and the card results line (when Card details is on) use it; the declarations live once in `design-system.css`.

**Mono text role.** Monospace glyphs are wider than sans at the same size, so mono has its own step: `--font-size-mono` is 0.85× body (minimum 11px) and follows Text size. The `.text-mono` class applies the role (`--font-family-mono`, uppercase, label tracking and line height); the At a glance columns use it. The family is the system monospace stack, so the face differs by browser (SF Mono in Safari, Menlo in Chromium on macOS, Consolas on Windows).

**Other tokens added in `tokens.css`:** `--hero-gap`; `--brand-avatar-size`; `--dock-top`; `--overview-column-gap`, `--overview-list-gap` and `--overview-label-width`; `--feature-stage-padding-block` and `--feature-stage-fade`; `--stage-reveal-card-duration` and `--stage-reveal-backdrop-duration`. `--motion-lift`, `--hero-entrance-scale` and `--backdrop-enter-scale` are CSS twins of values in `motion-tokens.js`; `tests/motion-tokens.mjs` fails if they drift apart.
