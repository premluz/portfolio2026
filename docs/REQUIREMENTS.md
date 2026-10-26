---
title: Requirements
type: requirements
status: active
owner: Prem
updated: 2026-10-26
summary: Intended behaviours of the features added in October 2026, each with how it is verified.
tags: [area/home, area/docs, area/motion, area/images, area/lab, area/dock]
related: [FRAMEWORK.md, MOTION.md, CONTENT_MODEL.md]
---
# Requirements

`Verifies` names a test file or `manual:` with what was checked and when. A requirement is `implemented` only when it is demonstrated.

## REQ-001 Generated image copies always match their originals
- Status: implemented
- Verifies: tests/image-freshness.mjs; manual: npm run build exited 1 naming a changed image, 2026-10-26
- Tags: area/images, area/tooling
- Related: ADR-001

## REQ-002 A project can have its own backdrop, with a generic fallback
- Status: implemented
- Verifies: tests/project-backdrop.mjs
- Tags: area/images, area/content
- Related: ADR-002

## REQ-003 Featured stage: one project per row, full-viewport backdrop, copy left and screenshot right
- Status: implemented
- Verifies: manual: browser measurements at 1440×900 (stage 900px tall, backdrop 1440×900 from the left edge, no horizontal scroll), 2026-10-26
- Tags: area/home

## REQ-004 The stage reveal plays each time a stage scrolls into view and is safe without script or motion
- Status: implemented
- Verifies: manual: two passes over the same stage behaved identically (reduced motion not exercised in a browser), 2026-10-26
- Tags: area/home, area/motion
- Related: ADR-003

## REQ-005 The project detail page can show its project's backdrop
- Status: implemented
- Verifies: manual: loaded the large copy, crossfaded Merlin to Bastion on Next, hid on return home, 2026-10-26
- Tags: area/project-detail, area/motion

## REQ-006 Entering or leaving the Lab sends one colour-split ripple across the page
- Status: implemented
- Verifies: manual: ring crossed the page change and cleared in under a second in both directions (the Lab links are currently hidden), 2026-10-24
- Tags: area/lab, area/motion
- Related: ADR-004

## REQ-007 Ambient glow colour is manual, automatic or project-based, in that order of precedence
- Status: implemented
- Verifies: manual: computed glow colours for four projects in each mode and with a manual override, 2026-10-24
- Tags: area/ambient

## REQ-008 New home sections and options start off
- Status: implemented
- Verifies: tests/content-widths.mjs; manual: strapline and At a glance hidden by default, 2026-10-26
- Tags: area/home, area/settings
- Related: ADR-005

## REQ-009 Headings scale separately from body text, and mono text sits below body size
- Status: implemented
- Verifies: manual: computed sizes at Small, Medium and Large (hero heading 24.7, 28, 32.1px and mono 11.2, 12.2, 13.6px), 2026-10-26
- Tags: area/design-system
- Related: ADR-006

## REQ-010 The dock's outline stays within its pill during Back at any pill width
- Status: implemented
- Verifies: tests/dock-morph.mjs; manual: 0 uncovered link frames in about 300 per run, three runs, 2026-10-25
- Tags: area/dock, area/tests

## REQ-011 The home and Lab pages expose the same controls
- Status: implemented
- Verifies: tests/lab-page.mjs
- Tags: area/lab, area/settings

## REQ-012 Home images are ready before the page fades back in under simple transitions
- Status: implemented
- Verifies: tests/media-loading.mjs; manual: simulated latency, all images ready with no requests, 2026-10-26
- Tags: area/home, area/images
- Related: FACT-007

## REQ-013 Every portfolio item has a project status
- Status: implemented
- Verifies: tests/assistant-data.mjs
- Tags: area/content

## REQ-015 Cards can show the client above the title and a details stack of status, results and tags
- Status: implemented
- Verifies: tests/card-details.mjs; manual: stacked order and gradient measured in a browser, defaults unchanged, 2026-10-26
- Tags: area/home, area/design-system
- Related: ADR-008

## REQ-016 Each featured project shows a row of note cards under its copy, and projects can hold separate home and detail card sets
- Status: implemented
- Verifies: tests/note-cards.mjs; manual: three cards per stage with loaded images, backdrop confined to the first row (810px of a 1274px stage), no horizontal scroll, defaults off, 2026-10-26
- Tags: area/home, area/content
- Related: ADR-009

## REQ-014 Navigation can sit at the top or bottom
- Status: accepted
- Tags: area/dock, area/settings
- Related: TASK-002

The setting exists and places the dock correctly, but the dock's attached menus still open upward, so the top position is not usable yet.
