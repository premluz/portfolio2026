---
title: Project constitution
type: constitution
status: active
owner: Prem
updated: 2026-10-26
summary: The principles every change follows; specifications, tasks and decisions must not contradict them.
tags: [area/docs, kind/process]
related: [MOTION.md, FRAMEWORK.md, MEDIA_ASSETS.md]
---
# Project constitution

These principles change rarely and only by an explicit decision (a new ADR). When a specification, task or request seems to contradict one, stop and ask.

1. **One authoritative home per kind of information.** Principles live here, intended behaviour in the topic docs and [requirements](REQUIREMENTS.md), task status in [TASKS.md](../TASKS.md), decisions in [docs/decisions](decisions/), verified findings in [FACTS.md](FACTS.md), the current picture in [PROJECT_STATE.md](../PROJECT_STATE.md). Do not restate one in another; link to it.
2. **Authored source, generated output.** `dist/*.js`, `dist/*.css`, `dist/*.html` and `content/catalog*.json` are authored. `dist/client/`, `dist/content/*` exports, `dist/site.css`, `dist/image-variants.js`, `dist/assets/optimised/` and `dist/assets/backgrounds/` are generated; change their sources and regenerate.
3. **Content is separate from presentation.** The catalog is the source of truth for projects and pages. Both content sets (`catalog.json`, `catalog2.json`) must stay valid.
4. **Tokens, not literals.** Colours, spacing, type sizes, easing and durations come from `tokens.css` and `motion-tokens.js` by role. A CSS twin of a JavaScript value is checked by a test so it cannot drift.
5. **Motion carries meaning and is optional.** The principles in [MOTION.md](../MOTION.md) apply. Reduced motion and Animation Off always show the resting state.
6. **New behaviour ships behind a setting and starts off,** unless the owner says otherwise, so the live site changes only when the owner chooses.
7. **Done means demonstrated.** Run the relevant tests and, for visible changes, the page itself. Name failures plainly; never summarise a failure as success.
8. **Hide, do not delete,** anything the owner has not asked to remove. Generated files are regenerated, not hand-edited.
9. **No secrets in the repository,** logs, examples or memory documents. Project memory never contains users' chat content.
10. **No new dependencies without approval.** The frontend is buildless native modules; npm is the one package manager.
