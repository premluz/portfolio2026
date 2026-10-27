---
id: ADR-010
title: A featured portrait card leads on the left; the right-hand rule is for other portrait cards
type: decision
status: accepted
owner: Prem
updated: 2026-10-27
summary: When a card is both featured and portrait, featured placement wins in the 3+ column grid, so the live layout is unchanged.
tags: [area/home, area/tests, kind/decision]
related: [TASK-001, FRAMEWORK.md]
---
# ADR-010 A featured portrait card leads on the left; the right-hand rule is for other portrait cards

**Context.** The masonry planner anchors featured cards at the left edge, two columns wide in grids of three or more columns, and keeps portrait cards in the right-hand columns. Bastion became both portrait and featured, so the two rules disagreed and tests/masonry-placement.mjs failed.

**Decision.** Featured wins. A featured portrait card leads on the left like every featured card; the right-hand rule applies to portrait cards that are not featured. The planner is unchanged, so no live layout moves; the test's portrait assertion was narrowed to match.

**Consequences.** A featured portrait card is a wide, tall card on the left. If the owner prefers it on the right, change `preferred` in `masonryPlan` (`dist/placement.js`) to `columns - columnSpan` for featured portrait cards and relax the "anchored at the left edge" assertion for them.
