# Voice and gesture navigation

The input architecture separates recognition, intention and presentation.
`dist/interaction-commands.js` is the versioned command catalog and shared bus.
The catalog includes commands, project aliases, valid route identities and
gesture sequences. A command is a small data object:

```js
{ id: 'project.open', target: 'playstation', source: 'voice' }
{ id: 'project.next', source: 'gesture' }
{ id: 'navigation.back', source: 'keyboard' }
```

| Intention | Voice | Gesture |
| --- | --- | --- |
| Open a project | Open + name or alias | Point with two joined fingers and thumb away in an L-shape; touch thumb to both fingertips |
| Next / previous | Next / Previous | Fast horizontal two-finger swipe left / right |
| Work / About / Contact | Work / About / Contact | Point and click the relevant navigation item |
| Site settings | Settings | Point and click the sliders icon |
| Projects popover | Menu, Index or List; bare Open after a pause | Point and click the project list icon |
| Scroll | Scroll up / down; Up / Down; Move up / down | Hold an open hand flat; tip fingers down / up to scroll down / up |
| Back / reverse | Back / Escape | From a closed hand, briefly show a standalone open palm, then fist before scroll mode |
| Disable voice | Stop listening | Point and click the voice switch or stop control |

Pointer clicks, arrows, project list selection and Escape now use the same bus.
It validates project identities, keeps the carousel scoped to portfolio
documents and rejects overlapping navigation. Back can interrupt a running
transaction. `app.js` supplies the routing adapters: existing card morphs,
slide transitions, summary reveals and Escape reversal continue to own motion.
A future spatial/XR adapter can submit the same intentions; the bus has no
screen-coordinate or recognition-engine dependency.

Each document may define `commandAliases`. Spoken aliases resolve to its
canonical project, while layout duplicates retain distinct pointer/route
identities. The parser accepts complete commands, not arbitrary occurrences
inside background conversation. Ambiguous or incomplete project names are not
executed. A lone interim “Open” waits for a name; at an utterance endpoint it
opens the project list. Home/information routes attach that list to the main
glass dock, without showing project arrows on those routes.

## Voice lifetime

`VoiceNavigation` uses the browser-provided `SpeechRecognition` or prefixed
`webkitSpeechRecognition` service after OK. It does not request language-pack
checks or installation, or require the experimental on-device APIs. The browser
chooses its speech engine, which may process audio online; the voice consent
guide states that explicitly. Unsupported browsers receive an explanation.

Each utterance is a non-continuous recognition session with interim results.
A complete known command aborts that session before dispatch. A speech pause
flushes the endpoint; final/stale results cannot execute the command again.
Recognition rearms after dispatch finishes and a short cooldown. Unknown speech
is discarded. The site does not record or store audio; the browser's provider
may receive audio for recognition. Transcripts are held only briefly for the
current status/command.

Voice scrolling uses `viewport.scroll.up` / `viewport.scroll.down`, available
on every route. Each command moves 72% of the viewport so the previous content
remains in view. An active project/settings popover takes priority over the
page. Animation Off/reduced motion makes the voice step immediate. Background
sentences containing the aliases do not match the exact command parser.

## Gesture lifetime and performance

`GestureNavigation` requests video only, at approximately 640×480. It sends
320px-wide bitmaps to a classic worker running the self-hosted MediaPipe Hand
Landmarker on the CPU. Dependencies are pinned to Tasks Vision 0.10.21 and
verified against the npm archive's published SHA-512. The SDK, SIMD/non-SIMD
WASM and model live under `dist/vendor/mediapipe`; there is no runtime CDN or
camera-upload request. Its README contains sources, license and checksums.

One hand and one bitmap are processed at a time. Capture caps at 15Hz, adapts
downward on slower hardware and uses video-frame callbacks where available.
Every bitmap is closed. Recognition blocks its worker, not the page's card
animation thread. No model or camera starts before consent, and no inference
loop remains after switch-off.

`GestureIntent` interprets joint angles, palm-relative distances and time.
Finger states use metric 3D joints when available and do not depend on screen
orientation. Stable joined index/middle fingers with the thumb away in an L-shape arm the
cursor. Bringing the thumb toward both fingertips freezes the last pointed
control before contact; stable contact activates it once. The fingers may bend
to meet the thumb. Distance thresholds scale with palm width, require both
fingertips and use hysteresis to reject fleeting contact and depth noise.
Clicking executes before the cursor can clear or re-test a different target.
A held contact cannot repeat; fresh pointing is required to rearm. A standalone
palm→fist arms Back, retaining that intent through intermediate poses before
scrolling starts. An open palm never clicks. Click and swipe releases cannot turn into Back, including after
a dropped tracking frame. Project swipes are recognized only on project routes;
fast pointing across home cards cannot consume the next click.

Holding an open hand briefly enters scrolling. Keep it flat like a wing for
neutral: fingertips down scroll down, up scroll up. Signed wrist-to-knuckle
pitch comes from the existing metric 3D joints, so either hand, the camera-facing
palm or back of the hand and edge-on flat hands use the same rules. There is no
palm-facing gate. Moving the whole hand while keeping it flat does not scroll.
More tilt increases speed. Angular entry/exit dead zones reject neutral jitter;
same-direction angle is filtered, with a nonlinear response for fine control.
Neutral and reversal take effect on the first sample without filter drift.
The visible control shows speed, direction and neutral. Closing or changing
pose, lost/invalid tracking or navigation stops immediately. A longer hold after
pointing/clicking prevents an incidental release from entering Scroll. Before
the scroll control appears, a standalone palm→fist is Back; once it appears,
including at neutral, closing only releases. Fresh L-shape pointing is required
before the next click. Constants live in `gestureTuning`.

A fist alone does nothing. Clicks fire once; swipe sequences cannot also click;
slow cursor movement and vertical motion do not change projects.
Tracking loss cancels remembered targets. Capture epochs discard stale frames
after pause, and session generations guard delayed camera/bitmap/worker setup.

`GestureCursor` performs hit testing against the existing accessible controls,
applies the same hover treatment and invokes their normal click handlers. It
has no separate content tree. There is no implicit cursor-edge scrolling.

`ViewportScroll` owns voice steps and hand rate input. Display frames integrate
the requested speed independently of camera samples. Speed eases in, reversals
discard the previous-direction velocity, and neutral/release stops without
drift. At page bounds there is no idle loop. A 350ms input lease also stops the
page if the camera worker stalls. Popover scope is captured once for the input
session; a detached menu cannot redirect its scroll onto the page. Voice steps
take priority over held hand input. Route/overlay actions stop scrolling and
require releasing the previous open hand before controlling the new surface.
Physical wheel, pointer-down and scrolling keys take priority and cancel an
active voice/hand scroll; synthetic gesture clicks do not count as manual input.

## Onboarding and shutdown

`SpatialNavigation` owns the full-screen, blurred-backdrop guide, activation
switches, status controls and camera cursor. Every activation requires OK.
Privacy copy differs between local camera tracking and browser-provided voice.
Opening the guide pauses the other input adapter; cancellation resumes it.
Permission errors stay in the guide, and Cancel is available during setup.
Microphone/camera activation is session-only and is not restored on reload.
Turning off gestures releases camera tracks, video, worker and callbacks;
turning off voice aborts recognition and clears timers. Leaving or hiding the
page switches both modes off.

Focused tests cover schema/parser behavior, native voice without installation,
voice scroll aliases/endpoints, captured thumb-contact targets, L-shape pointing,
back-facing/flat/up/down hand pitch, continuous neutral rate scrolling versus Back,
viewport scope/input arbitration, camera resource
cleanup and modal consent/cancellation.
Camera accuracy and actual browser speech support require real-device QA.

## Pattern choice

Pinch-to-commit follows established spatial input. This portfolio uses a custom
two-fingertip contact and a separate open-hand tilt scroll mode, rather than assigning
Click and Scroll to the same contact. The webcam scroll mode adapts
rate-controlled jog scrolling: small wrist rotations and a visible neutral control
avoid repeatedly moving an arm across the camera frame. Pointer, keyboard and
voice remain available. Recognition and comfort still need real-device testing.

- Apple: https://developer.apple.com/videos/play/wwdc2023/10073/
- Microsoft: https://learn.microsoft.com/en-us/windows/mixed-reality/design/point-and-commit
- Jog scrolling: https://developer.apple.com/design/human-interface-guidelines/scroll-views
