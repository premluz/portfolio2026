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
 lift:14,exitDrop:8,exitScale:.965
});
