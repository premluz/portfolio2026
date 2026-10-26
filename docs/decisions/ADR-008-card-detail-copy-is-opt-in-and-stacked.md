---
id: ADR-008
title: Card detail copy is opt-in, stacked, and drawn from existing fields plus disciplines
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Client position and card details are two off-by-default switches that stack the card copy; the gradient is one reusable class.
tags: [area/home, area/design-system, kind/decision]
related: [FRAMEWORK.md, DESIGN_SYSTEM.md, ADR-005, REQ-015]
---
# ADR-008 Card detail copy is opt-in, stacked, and drawn from existing fields plus disciplines

**Context.** The owner's mockup stacks, on a project card: a status pill, the client in wide-tracked capitals, a title ("what was done"), a results line in the About page's gradient text, and a row of discipline tags. Clients could already sit beside the title or lead it inline.

**Decision.** Two switches, both off by default (ADR-005): *Client above the title* (a third position that wins over Inline) and *Card details* (pill, gradient results, tags). Both switch the copy to a one-column flex stack, leaving the default grid untouched. The pill reads `projectStatus`; results are the existing `summary`; tags come from a new `disciplines` list. The gradient is extracted as `.text-gradient`, shared with the About highlight, rather than copied.

**Consequences.** The existing "Client leads the title" setting and exports keep working. The status shows its data value (Launched), not the mockup's wording (Shipped). Tags other than Tracr's are drafts for the owner to edit (TASK-013). Rejected: replacing the Inline checkbox with a three-way select (breaks saved settings and the generic checkbox table).
