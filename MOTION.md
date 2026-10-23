# Motion language

Motion on this site is restrained and directed. It explains where things came
from and where they go, confirms what the reader did, and otherwise stays out of
the way. Most of it is already right. This document names the system so new
motion is chosen from it instead of invented, and lists what should converge.

Code tokens live in `dist/motion-tokens.js` (JavaScript) and as `--ease-*`
variables in `dist/tokens.css` (stylesheets). Every value below matches the
code; when one changes, change it here in the same edit. `tests/motion-tokens.mjs`
checks the two agree and that stylesheets use roles, not literal curves.

## Principles

1. **Motion carries meaning.** Every movement answers "where did this come
   from, where did it go, did my action land?" If it answers none of those, it
   is decoration, and decoration is removed. The card-to-detail morph is the
   model: the reader sees the card become the page.
2. **Spatial continuity.** Things leave towards where they belong and arrive
   from where they were. A project returns into its card. Without a card to
   return to, the page recedes into the reader's current view, so it never
   appears to jump to a place they cannot see.
3. **Exits are faster than entrances.** The reader has already decided to
   leave, so an exit never keeps them waiting. Entrances may take a little
   longer because they are being read.
4. **Ease out to arrive, accelerate to leave.** Arrivals start fast and land
   softly. Exits accelerate away. Nothing uses a slow start on arrival.
5. **Small distances, consistent direction.** Motion suggests direction; it
   does not carry content across the screen. Lifts and drops are around 8–14px
   and scales stay above 0.92. Pages rise in and drop out.
6. **One lead, then support.** In any moment one thing leads (the shared image,
   the dock shape) and the rest follows in a short, ordered stagger. Text
   reveals top-down and leaves bottom-up, so the title is first in and last out.
7. **Frequency lowers intensity.** What the reader sees constantly (hover,
   press, tooltips) is fastest and quietest. What happens once per visit (a
   page change) may be richer.
8. **Interruptible and reversible.** Escape and back reverse a transition from
   wherever it is; nothing has to finish first. Springs and the shared
   transition clock exist for this.
9. **Optional.** Reduced motion and the Animation Off control make every change
   immediate. Settings at zero do no work at all.
10. **Cheap to run.** Animate `transform` and `opacity`. Per-frame loops run
    only while something moves and stop at rest.

## Tokens

### Easing (`EASE`, `--ease-*`)

| Token | Curve | Use |
|---|---|---|
| `settle` | `cubic-bezier(.22,1,.36,1)` | The house curve. Entrances, reveals, anything arriving or settling. |
| `gentle` | `cubic-bezier(.33,1,.68,1)` | Large surfaces that should arrive calmly (the hero image). |
| `leave` | `cubic-bezier(.4,0,1,1)` | Exits only. Never for arrivals. |
| `press` | `cubic-bezier(.2,.8,.2,1)` | Direct manipulation: button press and release, the pointer-tracking hover pill. |
| `standard` | `cubic-bezier(.4,0,.2,1)` | Something already on screen changing in place (a preview showing or hiding, About page details). |

In stylesheets use `var(--ease-settle)` and so on. The About illustrations keep
one deliberate overshoot curve; nothing else uses a literal.

### Duration

| Moment | Value | Notes |
|---|---|---|
| Page transition | 400ms default | The Transition duration setting; ×2.5 in slow mode. Morphs and slides use it. |
| Page entrance (simple) | `max(240, duration)` | Fade in rising. |
| Page exit (simple) | `duration × 0.5`, 160–240ms | Fade in place on `leave`; the same timing as the project exit. |
| Project page exit | `duration × 0.5`, 160–240ms | Recede; see below. |
| Hero image entrance | `duration × 1.225` | About a quarter longer than the page, `gentle`. |
| Detail text reveal | 220ms each, 44ms step, 240ms cap | Facts and actions after the title and summary. |
| Summary and title fade | 620ms | Fade mode of the summary stream. |
| Home hero exit | `duration × 0.4`, 12% steps | Description, heading, then badge. |
| Card content | in 220ms, out 180ms | Hover copy. |
| Toast | in 240ms, out 200ms | Rises and drops 8px. |
| Hover (nav, list) | in 70ms, out 420ms | Fast in, lingering out. |
| Hover (surface glow) | in 240ms, out 1000ms | |
| Press | in 90ms, out 300ms | |
| Tooltip | 350ms hover delay, 600ms warm window, 340ms arrival | Instant on keyboard focus and between neighbours. |

### Distance (`DISTANCE`)

| Token | Value | Use |
|---|---|---|
| `lift` | 14px | Pages rise this far on entry. |
| `exitDrop` | 8px | Pages drop this far on exit. |
| `exitScale` | 0.965 | A receding page's final scale. |
| Press scale | 0.92 | Glass buttons. Deliberately firmer than the usual 0.97, at the author's request. |
| Hero image scale | 0.94 → 1 | |

### Stagger (`DURATION`)

A stagger lives inside its phase. When many items share it, steps shrink
(`staggerStep` 28ms, at most `staggerSpan` 60% of the phase) rather than dropping
items. Order is top-down on entry and bottom-up on exit.

## Choreography

### Route changes

- **Project from a card:** the card morphs into the page. It is the signature
  motion and the lead; text follows with the detail reveal.
- **Back to the card:** the reverse morph, landing exactly where the card sits.
- **About and Contact:** slide in; fade back home.
- **Simple mode** (dev setting, and the fallback when a project was opened by
  link or refresh, so there is no card): the old page fades out in place, or is
  skipped with "No fade out"; the new page fades in rising 14px, the title,
  summary and facts stagger in, and the hero image grows in.
- **Leaving a project in simple mode:** the page recedes. It shrinks to 0.965
  and drops 8px as it fades, scaling around the middle of the current view, so
  a scrolled page shrinks where it is being read. Visible text steps out
  bottom-up, title last. The whole exit is about 200ms.

### Persistent chrome

- **The dock** is one liquid outline. Pills grow, merge and split from the same
  shape; nothing appears from nowhere. Its springs are tuned in Motion settings
  (stiffness, damping, overshoot).
- **Popovers** grow from the dock as part of the same outline.
- **Toasts** rise 8px over 240ms on `settle` and leave in 200ms, dropping back
  the same 8px. Their colour comes from an inner glow, not motion.

### Feedback

- **Press:** quick in (90ms), springy release (300ms).
- **Hover:** appears almost instantly, leaves slowly, so passing the pointer
  across a list feels calm.
- **Tooltips:** wait 350ms so passing over controls stays quiet; once one is
  open, neighbours show at once. A tooltip dismissed by a click stays hidden
  until the pointer leaves.
- **Ambient:** the Available badge's pulse is the only loop on the page. Loops
  stay rare and slow (2.4s) and stop under reduced motion.

## When not to animate

- Anything repeated many times a minute beyond hover and press.
- Keyboard-driven focus moves: tooltips show immediately, without a hover delay.
- Data and numbers the reader compares (tables, metrics).
- Anything at a setting of zero: the material loop, image ripple, trail and
  background blur skip their work rather than computing nothing.

## Audit: what should converge

Done on 23 October 2026:

- Ten curves became five roles. The two near-duplicates of `settle` and two
  one-off curves now use `settle`; the press curve on the hover copy stream
  (an arrival) became `settle`; exits that used the in-out curve (toasts, the
  thumbnail proxy, media-focus content) now use `leave`.
- Stylesheets name roles through `--ease-*` variables.
- `--ease-standard` was defined only on the About page, so the home experience
  rows' colour change was instant. It is now defined once for the whole site.
- Every simple page exit shares one timing (about 200ms on `leave`); projects
  recede, other pages fade.

Still open:

1. **JavaScript literals.** Many modules still write the `settle` curve as a
   string (it is the correct curve, just not named). They move to `EASE` as they
   are touched; durations follow the same path.
2. **Tooltip arrival** uses a 340ms keyframe with a small overshoot. It reads
   well, but it is the slowest high-frequency motion here; 200–250ms would
   match the frequency principle.

## Verification

Motion changes ship with a test that reads the real values
(`tests/project-page-exit.mjs`, `tests/hero-image-entrance.mjs`,
`tests/hero-exit.mjs`, `tests/simple-transitions.mjs`, `tests/tooltips.mjs`,
`tests/motion-tokens.mjs`) and,
for timing, a measurement in a real browser. Timing is measured inside the
page, never by screenshots over time.

## Sources

- Emil Kowalski, [7 practical animation tips](https://emilkowal.ski/ui/7-practical-animation-tips):
  press scale around 0.97, never animate from scale 0, skip tooltip delays
  between neighbours, ease-out for UI, origin-aware popovers, keep UI motion
  under about 300ms.
- Emil Kowalski, [Good vs great animations](https://emilkowal.ski/ui/good-vs-great-animations)
  and [Great animations](https://emilkowal.ski/ui/great-animations): origin
  awareness, custom easing over built-ins, interruptibility, frequency of use,
  transform and opacity, reduced motion.
- [animations.dev](https://animations.dev/), the course behind those posts:
  easing and duration, springs, when not to animate, orchestration.
- [Learn Motion Design, Zero To Mastery](https://zerotomastery.io/courses/learn-motion-design/):
  the vocabulary of easing, offset and delay, parenting, transformation,
  masking and dimensionality; motion as usability and mental models.
- Apple, [Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion),
  and the WWDC 2018 talk "Designing Fluid Interfaces" (as summarised in
  secondary write-ups): purposeful, brief, interruptible and redirectable motion
  that preserves spatial relationships and respects Reduce Motion.
