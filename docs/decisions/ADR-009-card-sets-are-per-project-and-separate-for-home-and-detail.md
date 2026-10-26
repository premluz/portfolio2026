---
id: ADR-009
title: Note cards are per-project card sets, separate for the home page and the case-study page
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Each project has homeCards and detailCards with one shared structure; only the home set renders now, and the detail page will reuse the structure.
tags: [area/content, area/home, kind/decision]
related: [CONTENT_MODEL.md, FRAMEWORK.md, REQ-016, TASK-015]
---
# ADR-009 Note cards are per-project card sets, separate for the home page and the case-study page

**Context.** The owner wants each featured project to show cards under its copy: roomy cards holding an image or video (a smaller one inside), each with an optional title and description. The case-study pages will be built from the same kind of card, one large or two in a row. The home selection may differ from the detail one.

**Decision.** A portfolio item carries two optional lists with one structure, `homeCards` and `detailCards`: `{id, mediaId, title?, description?}`, media an image or video asset. The projection resolves media so renderers never look assets up. Only `homeCards` renders now, in Featured stage mode, three per project; each is seeded with the project's own cover image and no invented copy.

**Consequences.** Authoring a card is a data change, and the detail page can adopt the structure without a migration (TASK-015). The cards' width, padding and the media's maximum size are tokens, since the owner was unsure of the right values. Rejected: reusing generic `blocks` (no home/detail distinction and no per-card media typing) and a single shared list (the owner wants different selections).
