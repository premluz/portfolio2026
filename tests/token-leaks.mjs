import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {clientStyles} from '../scripts/client-styles.mjs';
import {DURATION} from '../dist/motion-tokens.js';

const dist=new URL('../dist/',import.meta.url);
const stripComments=text=>text.replace(/\/\*[\s\S]*?\*\//g,'');
const sheets=await Promise.all(clientStyles.map(async file=>({file,text:stripComments(await readFile(new URL(file,dist),'utf8'))})));
const tokens=sheets.find(sheet=>sheet.file==='tokens.css').text;
const authored=sheets.filter(sheet=>sheet.file!=='tokens.css');
const count=pattern=>authored.reduce((sum,sheet)=>sum+(sheet.text.match(pattern)||[]).length,0);

// What counts as a leak: a hex colour; a duration written as <n>ms or <n>s; a font-size whose value holds a number
// and no var(). Measured 2026-11-10 over the authored stylesheets in clientStyles except tokens.css. A ceiling only
// goes down: replace literals with tokens, then lower the number to the new count.
const CEILINGS={hexColours:74,durations:133,fontSizes:67};
const leaks={
 hexColours:count(/#[0-9a-fA-F]{3,8}\b/g),
 durations:count(/(?<![\w.-])\d*\.?\d+(?:ms|s)\b/g),
 fontSizes:count(/font-size\s*:\s*(?![^;}]*var\()[^;}]*\d/g)
};
for(const [name,ceiling] of Object.entries(CEILINGS)){
 assert(leaks[name]<=ceiling,`${name}: ${leaks[name]} literals, ceiling ${ceiling}. Use a tokens.css variable.`);
 assert(leaks[name]===ceiling,`${name}: ${leaks[name]} literals is below the ceiling ${ceiling}. Lower CEILINGS.${name} so it cannot grow back.`);
}

// Duration roles: each --duration-* token exists, and where an older per-component token carries the same role they agree.
const token=name=>tokens.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
const ROLES={
 'duration-hover-in':'70ms','duration-hover-out':'420ms','duration-glow-in':'240ms','duration-glow-out':'1000ms',
 'duration-press-in':'90ms','duration-press-out':'300ms','duration-card-content-in':'220ms','duration-card-content-out':'180ms',
 'duration-toast-in':'240ms','duration-toast-out':'200ms','duration-tooltip-arrive':'240ms','duration-detail-reveal':'220ms'
};
for(const [name,value] of Object.entries(ROLES))assert.equal(token(name),value,`--${name} is ${value} (MOTION.md > Duration)`);
const OLDER={'nav-hover-in-duration':'duration-hover-in','nav-hover-out-duration':'duration-hover-out','surface-hover-in-duration':'duration-glow-in','surface-hover-out-duration':'duration-glow-out','glass-button-press-in-duration':'duration-press-in','glass-button-press-duration':'duration-press-out','card-content-in-duration':'duration-card-content-in','card-content-out-duration':'duration-card-content-out'};
for(const [older,role] of Object.entries(OLDER))assert.equal(token(older),token(role),`--${older} equals --${role}`);
assert.equal(`${DURATION.detailReveal}ms`,token('duration-detail-reveal'),'The detail reveal duration is the same in JavaScript and CSS');

console.log(`Token leaks passed: ${JSON.stringify(leaks)} within their ceilings; duration roles defined and equal to the older component tokens.`);
