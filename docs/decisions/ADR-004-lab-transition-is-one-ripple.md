---
id: ADR-004
title: The Lab transition is a single colour-split ripple
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Entering and leaving the Lab sends one ring across the page; the earlier whole-page noise warp was rejected.
tags: [area/lab, area/motion, kind/decision]
related: [FRAMEWORK.md, MOTION.md, REQ-006]
---
# ADR-004 The Lab transition is a single colour-split ripple

**Context.** The first version warped the whole page with noise, split its colour channels and left the page distorted for about eleven seconds, reacting to the cursor. The owner rejected it: it should be one ripple, "not like water, not everything waving".

**Decision.** One ring expands from the click point, displacing the red, green and blue channels by slightly different amounts so the fringe appears only on the ring. The page changes at 42% of the ring's travel and the destination resumes it from the stored origin and progress. It is an SVG filter over the live page; the ring's displacement map is drawn once on a canvas.

**Consequences.** No lingering distortion and no cursor reaction. Reduced motion navigates directly. The Lab links are currently hidden but kept (see [PROJECT_STATE.md](../../PROJECT_STATE.md)).
