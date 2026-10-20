# Carousel snapping: attempts log

The circular carousel (`dist/circular-card-gallery.js`, `dist/carousel-momentum.js`) is back to its original
behaviour from commit `b97a6ff` (19 Oct 2026). This log records every attempt to change how it snaps, what
each one did, the feedback it got, and why it was dropped. All the patches below apply to that original:

```sh
git apply patches/<name>.patch     # try an attempt again
git restore --source=b97a6ff -- dist/circular-card-gallery.js dist/carousel-momentum.js tests/circular-card-gallery.mjs tests/carousel-momentum.mjs   # back to original
```

## The goal, in the feedback's own words

- Snapping should feel like a soft, continuous slow-down. A strong scroll slows down and lands; a light scroll moves one tick.
- It should not end with a strong "return" snap.
- The snap should be part of the original movement, not a second movement. It should never go past a card and come back.
- It should be decisive and fast to interact with, accessible, and seamless.
- Strong Magic Mouse and trackpad swipes must not flash through cards fast enough to risk triggering seizures.

## Original behaviour (`b97a6ff`, current)

- **Drag:** the ring follows the finger 1:1.
- **Release:** the ring coasts with an exponential slow-down (`decay` 420 ms) until it is almost still, then snaps.
- **Snap:** `go(nearest)`, the arrows' ease, an exponential approach (τ = 95 ms × 100 / speed setting). It can move backwards to a card behind.
- **Wheel and trackpad:** the ring moves 1:1 with the scroll steps. 120 ms after the last step, it snaps.
- **Complaint:** the coast ends, then a separate quick "return" move snaps to the card.

## Attempts

### 1. Glide to the card ahead

Not saved; superseded by later attempts.

- **What it did:**
  - On release, chose the card nearest to where the coast would stop, but never one behind the ring.
  - Glided there with a cubic ease-out that leaves at the release speed (duration 3·d/v, between 320 and 1400 ms).
  - Wheel: 70 ms after scrolling stopped, released with the speed from the last 90 ms.
- **Feedback:** "it slows down and then fastens to snap."
- **Why:** during a trackpad swipe the ring followed the trackpad's own coasting almost to a stop. The glide then started from the speed averaged over the last 90 ms, which was faster than that crawl.

### 2. Wheel follows a target, glide reshaped to keep the speed

Not saved; superseded.

- **What it did:**
  - Scroll steps moved an invisible target, and the ring eased after it (110 ms).
  - When scrolling stopped, a curve that leaves at exactly the current speed (Hermite) took over.
- **Why it was dropped:** a light scroll has almost no speed but still has to reach the next card. It cannot get there by only slowing down, so it had to speed up.

### 3. Speed added per scroll step, one re-planned glide

Not saved; superseded.

- **What it did:**
  - Each scroll step added speed so that the projected stop moved by that step's distance.
  - One slowing curve was re-planned on every step.
  - Speed could only rise at an input, never on its own.
- **Feedback:** "still there is a moment when it gets janky; should be precise as arrows; we should be able to tell how many ticks it'll go."
- **Why:** re-planning on every scroll event, many times per frame, read as jitter.

### 4. Tick navigation

Patch: `carousel-tick-navigation.patch`.

- **What it did:**
  - Every gesture resolves to a whole number of cards, then moves exactly like the arrows.
  - Scroll: one card width of travel is one tick, and any deliberate scroll is at least one tick.
  - Drag: on release, the card nearest to where the release speed points.
  - The arrows' ease now ends with a sub-pixel finish instead of a small snap.
- **Then:** after the seizure concern, capped at 3 cards per gesture and 3 cards per second.
- **Feedback:** "the feel is just not right; the slide-through feels not responsive. Go back; snapping was much better before. Just soften the snapping."

### 5. Original plus a soft spring snap

Folded into attempt 6.

- **What it did:** the snap became a critically damped spring (`snapTime` 130 ms) that carries on at the coast's remaining speed, or starts from rest.
- **Feedback:** "the snap should be part of the original movement, not another; it should never go beyond, so it never comes back."

### 6. Coast lands on the card

Patch: `carousel-coast-to-card.patch`. This is the version in commit `19e78f6`.

- **What it did:**
  - At release, chose the card ahead nearest to the coast's natural stop.
  - Retuned the same exponential coast to start at the release speed and end exactly on that card (τ = d/v, between 90 and 700 ms).
  - Wheel: the ring eased after the scroll (120 ms). When scrolling stopped, the remaining motion was reshaped onto a card at the same speed.
  - The spring remained only for a drag released from rest.
- **Feedback:** "it still feels like an additional movement and is janky, this slow snapping. Too slow. The requirement is decisive, fast to interact with, accessible, seamless."

### 7. Decisive release

Patch: `carousel-decisive-release.patch`.

- **What it did:**
  - Trackpad swipes were handled like a drag: the ring followed 1:1.
  - The moment the trackpad's coasting began (3 shrinking steps under 80 % of the peak) counted as letting go, and the rest of the coasting was ignored.
  - On release, the card was chosen at once: at most 3 cards on, never behind a moving ring.
  - One curve of 280–400 ms then took the ring there, leaving at exactly the release speed, never overshooting or coming back.
  - A wheel notch or deliberate push of 40 px or more moved one card.
- **Feedback:** "it still feels janky the moment it scrolls and gets into snap mode at a different pace." Reverted to the original.

### 8. Native snap scrolling

Live behind a setting. In `?dev=1` settings, turn on "Native snap scrolling (experiment)". It is off by default, so the original behaviour stays the default.

- **What it does:**
  - The circular carousel's viewport becomes a real horizontal scroller with CSS `scroll-snap-type: x mandatory` and one snap point per card, spaced like the cards on the ring.
  - The cards sit in a `position: sticky` layer, so the browser never moves them itself. The ring's angle simply follows `scrollLeft`.
  - The browser handles wheel, trackpad, Magic Mouse and touch coasting and the snap as one native motion. There is no hand-off to our own animation.
  - The track repeats 7 times so the ring can turn either way. It re-centres by whole loops when idle, which shows an identical picture.
  - Mouse drag: snapping pauses during the drag, then the release glides natively to the card the release speed points at.
  - Arrows: native smooth scroll to the next card.
- **Code:**
  - `dist/circular-native-scroll.js` (new), with small hooks in `dist/circular-card-gallery.js` and `dist/card-gallery.js`.
  - The setting is wired in `dist/app.js`, `dist/index.html`, `dist/settings-transfer.js` and `dist/default-settings.js`.
  - `dist/retained-home.js` now carries scroll positions across page transitions, which also protects the flat perspective carousel.
- **Pitfall found:** moving the home page in and out of transition layers resets any scroller to 0 without a scroll event. The native ring repairs this from its angle: on scroll, on resize, and when a route settles.
- **Test:** `tests/visual/native-snap.spec.mjs` covers a wheel swipe, the arrows, a mouse drag, and opening a project and returning. Every case lands centred on a card.
- **Feedback:** pending.

## What these attempts taught us

- **Landing on a card forces a trade-off.** From an arbitrary release, the ring can only land exactly on a card by doing one of these:
  - changing pace (speeding up, or slowing down harder than the coast would);
  - going past the card and back;
  - committing to a card early, which feels less direct.

  Every attempt traded one of these for another, and each choice drew a matching complaint: "fastens", "comes back", "not responsive" or "different pace".
- **Trackpad and Magic Mouse coasting can't be cleanly separated from finger movement.** The browser delivers the operating system's coasting as ordinary scroll steps. Any hand-off from coasting driven by those steps to our own animation changes pace somewhere. That is the "different pace" felt in attempts 1, 2, 6 and 7.
- **Synthetic tests can't judge the feel.** Each attempt passed frame-by-frame tests: it never comes back, it only slows down, it leaves at the release speed. The feel still failed on a real Magic Mouse and trackpad.

## Directions not yet tried

- **Real gesture recordings.** Record actual Magic Mouse and trackpad scroll-step traces (timestamps and deltas) from the target devices. Tune and test against those instead of synthetic sequences.
- **Prototype first.** Prototype the feel in an isolated page and agree it on device before wiring it into the site.
