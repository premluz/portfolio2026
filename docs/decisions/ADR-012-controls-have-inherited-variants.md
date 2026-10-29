---
id: ADR-012
title: Controls have inherited Ghost, Outline and Glass variants
type: decision
status: accepted
owner: Prem
updated: 2026-10-29
summary: One global control variant with group and element overrides replaces overlapping navigation/glass flags; card glass is independent.
tags: [area/dock, area/home, kind/decision]
related: [DESIGN_SYSTEM.md, FRAMEWORK.md, TASKS.md]
---
# ADR-012 Controls have inherited Ghost, Outline and Glass variants

**Context.** Plain navigation and Glass buttons & cards overlapped, leaving project controls, carousel arrows and suggestions with inconsistent resting and hover materials. Their separate rules also tied card decoration to control styling.

**Decision.** A single global Ghost / Outline / Glass choice supplies defaults. Saved group overrides inherit unless explicitly selected; an element or enclosing group's `data-control-style` takes precedence. The material and interaction contract is in DESIGN_SYSTEM.md. The card-glass flag remains separate.

**Consequences.** Existing plain navigation maps to Ghost; otherwise disabled glass maps to Outline and enabled glass maps to Glass. The old combined flag supplies the initial card-glass preference. Migration preserves explicit new choices and local overrides, including in exported and published profiles. Dynamic controls receive the same variant rules. Composer input surfaces remain readable when their buttons are Ghost.
