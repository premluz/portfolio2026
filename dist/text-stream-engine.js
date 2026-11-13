// Pacing and edge maths for streaming text, ported from PremLab's streaming-text engine
// (studio-ui/packages/premlab/src/components/streaming-text/engine.ts). That engine adapted Iconiq's
// streaming-text (MIT © 2024–2026 Edwin Vakayil) by way of this project's own assistant stream.
// The whole string stays laid out from the first frame, so nothing reflows as it streams.

// The first frame has no previous timestamp; a long stall must not jump the text.
export const FRAME=Object.freeze({firstMs:1000/60,maxMs:40});
// Each unit still waiting adds this much speed (units/s), up to the ceiling.
export const CATCH_UP=Object.freeze({perPendingGlyph:3.5,maxRate:220});
export const GLYPH_SETS=Object.freeze({
 code:'abcdefghijklmnopqrstuvwxyz<>/\\|=+-*_.,:;[]{}',
 letters:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
 digits:'0123456789',
 binary:'01'
});
export const UNITS=Object.freeze(['character','word']);

let segmenter;
// User-perceived characters, so an emoji sequence or an accented letter is never split mid-animation.
export function graphemes(text){
 // Engines without Intl.Segmenter fall back to code points: right for almost all text.
 if(segmenter===undefined)segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
 return segmenter===null?Array.from(text):Array.from(segmenter.segment(text),part=>part.segment);
}

// A word keeps its trailing whitespace; leading whitespace is its own token. Joined, the tokens are the exact text.
const WORD_TOKEN=/\S+\s*|\s+/gu;
export function tokenize(text,unit){
 if(!UNITS.includes(unit))throw new Error(`Unknown stream unit "${unit}"; expected one of ${UNITS.join(', ')}`);
 return unit==='word'?text.match(WORD_TOKEN)??[]:graphemes(text);
}

// progress: {shown, credit}. shown runs past the text by the edge length so the edge drains too; credit holds
// fractional units earned but not yet shown, so pace does not depend on the frame rate.
export function advance(progress,total,elapsedMs,{rate,catchUp}){
 const waiting=total-progress.shown;
 const current=catchUp?Math.min(CATCH_UP.maxRate,Math.max(rate,waiting*CATCH_UP.perPendingGlyph)):rate;
 const credit=progress.credit+elapsedMs*current/1000,step=Math.floor(credit),shown=Math.min(total,progress.shown+step);
 return {shown,credit:shown===total?0:credit-step};
}

// Settled text, the moving edge, and the laid-out but unpainted rest.
export function split(units,shown,edgeLength){
 const edgeEnd=Math.max(0,Math.min(units.length,shown)),edgeStart=Math.max(0,Math.min(edgeEnd,shown-edgeLength));
 return {settled:units.slice(0,edgeStart).join(''),edgeStart,edge:units.slice(edgeStart,edgeEnd),pending:units.slice(edgeEnd).join('')};
}

// Knuth's multiplicative hash spreads neighbouring positions and ticks across the glyph set.
const KNUTH=2654435761,TICK_MIX=40503,POSITIONS_PER_UNIT=1024;
// Pure, so renders are repeatable. Whitespace is kept.
export function scrambleGlyph(original,position,tick,set){
 if(original.trim()==='')return original;
 const glyphs=GLYPH_SETS[set];if(!glyphs)throw new Error(`Unknown glyph set "${set}"; expected one of ${Object.keys(GLYPH_SETS).join(', ')}`);
 const hash=(Math.imul(position+1,KNUTH)^Math.imul(tick+1,TICK_MIX))>>>0;
 return glyphs[hash%glyphs.length]??original;
}
// Every grapheme of a unit (one character, or a whole word with its trailing space) scrambles independently.
export function scrambleUnit(unit,position,tick,set){
 return graphemes(unit).map((glyph,index)=>scrambleGlyph(glyph,position*POSITIONS_PER_UNIT+index,tick,set)).join('');
}
