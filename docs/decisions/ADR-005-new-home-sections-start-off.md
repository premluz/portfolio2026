---
id: ADR-005
title: New home hero sections ship off by default
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: The strapline, At a glance, Featured stage and Project backdrop options all start off so the live site changes only when switched on.
tags: [area/settings, area/home, kind/decision]
related: [FRAMEWORK.md, CONTENT_MODEL.md]
---
# ADR-005 New home hero sections ship off by default

**Context.** The owner asked for several additions to the home page (a strapline, a three-column overview, a full-viewport featured stage, per-project backdrops) and described each as something to toggle.

**Decision.** Each is a developer setting that starts off. Home sections use the existing section-switch mechanism in `home-sections.js`; the stage and backdrop have their own switches. Settings persist locally and are included in settings export.

**Consequences.** Deploying the code changes nothing visible until the owner enables an option in the published settings. Tests that assumed every home section starts visible were updated to compare against the defaults.
