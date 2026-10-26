---
id: ADR-006
title: Heading and body type scales are separate variables
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Text size sets --type-scale for body and --heading-scale for headings so headings can be much smaller; mono text has its own step.
tags: [area/design-system, area/home, kind/decision]
related: [DESIGN_SYSTEM.md]
---
# ADR-006 Heading and body type scales are separate variables

**Context.** The "Small" text size left the hero heading too large, and one multiplier could not make headings much smaller without shrinking body text below readable sizes. Monospace text also looked larger than sans body text at the same size.

**Decision.** Text size sets `--type-scale` (body, small text) and `--heading-scale` (hero, section and footer headings) separately: Small .82/.6, Medium .9/.68 (default), Large 1/.78. The body floor is 13px. Mono text uses `--font-size-mono`, 0.85× body, through the `.text-mono` class.

**Consequences.** Medium body text is now what Small used to be, so default text is about 10% smaller site-wide; the hero heading is about 28px at 1440px instead of about 41px. The tokens are listed in [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md).
