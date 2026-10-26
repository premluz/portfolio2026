---
id: ADR-002
title: Backdrops are linked by asset id, fall back to a generic one, and are cropped at build time
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: A presentation names its backdrop asset; the build crops whole-canvas exports to the photo frame and writes web copies.
tags: [area/images, area/content, area/home, kind/decision]
related: [MEDIA_ASSETS.md, CONTENT_MODEL.md, ADR-001]
---
# ADR-002 Backdrops are linked by asset id, fall back to a generic one, and are cropped at build time

**Context.** The owner exports backdrops from a design tool. The first exports were whole 16,544×5,408px canvases with the photo in one corner; later ones were photo-only 2880×1920px files. Backdrops differ per project but not every project has one.

**Decision.** `presentations[].card.backgroundMediaId` names an image asset (id ending `-bg`); projects without one use `generic-bg`. `scripts/build-backgrounds.mjs` finds a photo frame inside a canvas export and crops to it (a photo-only export is used whole), then writes 1920px and 3840px copies. The thumbnail script skips `-bg` assets.

**Consequences.** The owner can export either way. A typo in a backdrop filename blocks the whole content build, which is intended (see [FACT-006](../FACTS.md)). Rejected: shipping the originals (16k px, 3.7MB each) and a fixed crop rectangle (breaks per export).
