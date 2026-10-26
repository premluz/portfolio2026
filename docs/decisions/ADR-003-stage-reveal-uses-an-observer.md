---
id: ADR-003
title: The featured stage reveal is a timed, observer-driven transition, not a scroll-linked animation
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Each stage plays a timed reveal when it enters view and resets when it leaves, using IntersectionObserver and CSS transitions.
tags: [area/motion, area/home, kind/decision]
related: [MOTION.md, FRAMEWORK.md, FACT-005]
---
# ADR-003 The featured stage reveal is a timed, observer-driven transition, not a scroll-linked animation

**Context.** The owner asked that the backdrop keep its timed scale-down as a stage scrolls in, and that the card scale up with the simple-transition entrance. A first version used a CSS scroll-driven animation; it replaced the backdrop's own transition and tied the motion to scroll distance, so it read as barely visible.

**Decision.** `feature-stage-reveal.js` observes the staged cards and toggles `data-stage-in-view` at a quarter visible. CSS transitions (card 490ms, photo 1400ms, `gentle` easing) play on entry; a card that has fully left resets instantly so the reveal replays on every scroll down. The hidden start state applies only while the gallery has `data-stage-reveal`.

**Consequences.** Works in every browser with IntersectionObserver, replays reliably, and keeps the existing timed motion. Rejected: `animation-timeline: view()`, see [FACT-005](../FACTS.md).
