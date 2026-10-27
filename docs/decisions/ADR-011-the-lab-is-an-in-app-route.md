---
id: ADR-011
title: The Lab is an in-app route, not a second HTML page
type: decision
status: accepted
owner: Prem
updated: 2026-10-27
summary: The Lab is #lab inside the single-page app (the home cards as four even columns), entered through the ripple; lab.html only redirects.
tags: [area/lab, area/home, kind/decision]
related: [ADR-004, REQ-006, REQ-011, FRAMEWORK.md]
---
# ADR-011 The Lab is an in-app route, not a second HTML page

**Context.** The Lab was `lab.html`, a hand-kept copy of the home page. Entering it ran the ripple and then loaded a whole new document (about 170 module requests, the catalog and the fonts), so the browser loader showed after the ripple while Work, About and Contact swapped content in place. The copy also had to carry every control id the home page had (REQ-011).

**Decision.** The Lab is the route `#lab`. It renders the home page's cards through the same `HomeLayout`, with `LAB_VIEW` (regular layout, four columns, cards) overriding the visitor's saved grid choices. Entering or leaving it always uses the simple page transition, and that transition plays the ADR-004 ripple (`lab-transition.js`: `out()` to the handoff, the route swaps, `in()` finishes the ring). `lab.html` remains only as a redirect to `./#lab`. The Lab has no catalog document; it is code, listing the existing project cards.

**Consequences.** No page load, so the Lab is as quick as the other routes. REQ-011 is dropped and so is the rule to mirror controls into a second page. Opening a project from the Lab fades rather than morphing from its card, and Back returns to the Lab. The `sessionStorage` handoff and the `data-lab-transition` links are gone. Supersedes the page copy described in ADR-004; the ripple itself is unchanged.
