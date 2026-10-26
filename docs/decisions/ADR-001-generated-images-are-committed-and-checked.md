---
id: ADR-001
title: Generated image copies are made locally, committed, and checked at build time
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Thumbnails and backdrop copies are produced by a local command and committed; the build only verifies them by checksum.
tags: [area/images, area/tooling, kind/decision]
related: [MEDIA_ASSETS.md]
---
# ADR-001 Generated image copies are made locally, committed, and checked at build time

**Context.** Replacing `bastion.png` left the site showing the old image, because the site serves generated WebP copies and nothing regenerated them. The generators need Python with Pillow and macOS `sips`, which a Linux deploy build cannot be assumed to have. File dates were not usable as a signal: Finder keeps a moved file's old modified date.

**Decision.** `npm run images` runs both generators locally and the outputs are committed. `npm run build` and `npm run check` first run `check:images`, plain Node, which compares each original's SHA-1 with the checksum recorded when its copies were made, and fails naming the stale image.

**Consequences.** A forgotten step stops the build with a clear message instead of silently shipping old images. Originals must be committed with their generated copies. Rejected: running the generators inside `npm run build` (breaks deploys) and comparing modified times (unreliable). See [FACT-003](../FACTS.md).
