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

**Decision.** The Lab is the route `#lab`. It renders the home page's cards through the same `HomeLayout`, with the Lab settings (`lab-settings.js`: masonry, four columns, featured cards not larger, details shown by default) overriding the global card settings on the Lab only. Entering or leaving it always uses the simple page transition: a short ring answers the click immediately without delaying anything (`click()`), the old page fades out and the Lab fades in, and the full ADR-004 ripple on the landed page (`land()`) is kept behind `LAB_RIPPLE.landing`, currently off; leaving the Lab is the ordinary fade. `lab.html` remains only as a redirect to `./#lab`. The Lab has no catalog document; it is code, listing the existing project cards.

**Consequences.** No page load, so the Lab is as quick as the other routes. REQ-011 is dropped and so is the rule to mirror controls into a second page. Opening a project from the Lab fades rather than morphing from its card, and Back returns to the Lab. The `sessionStorage` handoff, the mid-ring page swap and the `data-lab-transition` links are gone. Supersedes the page copy described in ADR-004; the ripple itself is unchanged.
