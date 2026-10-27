// The motion language in code (see MOTION.md). New motion picks from these; legacy literals migrate over time.
export const EASE=Object.freeze({
 // Settle: enters, reveals and anything arriving. Fast start, long soft landing. The house curve.
 settle:'cubic-bezier(.22,1,.36,1)',
 // Gentle: large surfaces (hero media) that should arrive calmly rather than snap.
 gentle:'cubic-bezier(.33,1,.68,1)',
 // Leave: exits only. Accelerates away so the next state is not kept waiting.
 leave:'cubic-bezier(.4,0,1,1)',
 // Press: direct manipulation feedback, quick in and springy out.
 press:'cubic-bezier(.2,.8,.2,1)',
 // Standard: something already on screen changing in place (a preview showing or hiding).
 standard:'cubic-bezier(.4,0,.2,1)'
});
export const DURATION=Object.freeze({
 // Exits are always shorter than entrances: the user has already decided to go.
 exitShare:.5,exitMin:160,exitMax:240,
 enterMin:240,
 // A stagger fits inside its phase: steps shrink when many items share it, so none is dropped.
 staggerStep:28,staggerSpan:.6
});
export const DISTANCE=Object.freeze({
 // Small, consistent travel: motion suggests direction, it never carries content across the screen.
 lift:14,exitDrop:8,exitScale:.965,
 // Small feedback (toasts, status) lands a pixel past its rest and settles back, so it reads as arriving, not stopping.
 settlePast:1
});
// Lab: a single ring from the click, colour-split by dispersion. The page changes at `handoff`.
// `landing` switches the second ring that used to run once the Lab had faded in; only the click ring runs for now.
export const LAB_RIPPLE=Object.freeze({landing:false,durationMs:1400,handoff:.42,ringRadius:.82,ringWidth:.07,maxWarpPx:64,dispersion:.35,swell:12,fade:1.6,restAmplitude:.004});
// Backdrop: a once-per-page surface, so it may be richer. It arrives on `gentle` from a slightly larger
// scale (a camera settling, not a zoom), leaves on the exit timing, and drifts behind the content with scroll.
export const BACKDROP=Object.freeze({enterShare:2.2,enterScale:1.06,parallax:.08,parallaxMax:.08});
// Character (MOTION.md → Character): the agent is a body, not content, so it alone may cross the screen and
// overshoot its scale. Travel time grows with distance; far trips (a share of the viewport diagonal) teleport,
// mid-range ones sometimes do, so the body never feels scripted. Exits (collapse) stay shorter than entrances.
export const AGENT=Object.freeze({
 travelMin:380,travelMax:900,travelPerPx:.45,arcMax:40,arcShare:.12,wobble:6,
 teleportShare:.55,teleportMixShare:.3,teleportChance:.35,
 collapseMs:200,teleportGapMs:80,emergeMs:520,landingMs:280,
 emergeScale:[.6,1.14,.94,1.03,1],emergeBlur:6,collapseScale:[1,1.06,.5],collapseBlur:4,landingSquash:[1.06,.94],
 // A visitor leaving is not a command to vanish: the body lingers, then goes home.
 lingerMs:1200,snapPx:24,seatGap:12,bodyShare:.55
});
