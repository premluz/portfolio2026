import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dockGeometry,mirrorPathY,mirrorBranch} from '../dist/dock-morph.js';
import {normalizeReaderTextSize,READER_TEXT_SIZES} from '../dist/site-preferences.js';

// Mirroring flips only y: H keeps x, V and every second coordinate of M/C become h - y; twice is the identity.
assert.equal(mirrorPathY('M 10.000 2.000 H 30 V 40 C 1.000 2.000 3.000 4.000 5.000 6.000 Z',48),'M 10.000 46.000 H 30 V 8.000 C 1.000 46.000 3.000 44.000 5.000 42.000 Z');
const numbers=path=>path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/g).map(Number);
const metrics={main:252,context:0,gap:12,height:48,radius:24},popover={width:330,height:200,left:-40,gap:14,radius:24,anchor:'main',position:.6};
const shape=dockGeometry(1,metrics,popover);
assert(shape.popover.top<0,'Unmirrored, the menu grows above the dock');
const twice=mirrorPathY(mirrorPathY(shape.path,48),48);
numbers(twice).forEach((value,index)=>assert(Math.abs(value-numbers(shape.path)[index])<.002,'Mirroring twice restores the outline'));
const flipped=mirrorBranch(shape.popover,48);
assert(flipped.top>=48-.001,'Mirrored, the menu sits below the dock');
assert.equal(+(flipped.top+flipped.height).toFixed(3),+(48-shape.popover.top).toFixed(3),'Its far edge mirrors the original far edge');
assert(Math.max(...numbers(mirrorPathY(shape.path,48)).filter((_,i)=>i%2===1))>48,'The mirrored outline extends under the dock');

assert.deepEqual(READER_TEXT_SIZES,['small','medium','large']);
assert.equal(normalizeReaderTextSize('large'),'large');
assert.equal(normalizeReaderTextSize('huge'),'medium','Unknown sizes fall back to the default');

const tokens=fs.readFileSync(new URL('../dist/tokens.css',import.meta.url),'utf8'),design=fs.readFileSync(new URL('../dist/design-system.css',import.meta.url),'utf8');
assert.equal((tokens.match(/var\(--reader-text-scale\)/g)||[]).length,1,'Only one token reads the visitor scale');
assert(/--font-size-body:[^;]*var\(--reader-text-scale\)/.test(tokens),'That token is body text');
assert(design.includes(':root[data-reader-text-size="small"]{--reader-text-scale:.91}')&&design.includes(':root[data-reader-text-size="large"]{--reader-text-scale:1.11}'));

const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const nav=html.match(/<nav aria-label="Main navigation">[^]*?<\/nav>|<nav aria-label="Main navigation">[^]*?id="sitePreferencesToggle"/)[0];
assert(nav.indexOf('data-nav="contact"')<nav.indexOf('id="sitePreferencesToggle"'),'The gear follows Contact');
assert(/id="sitePreferencesToggle"[^>]*hidden/.test(html),'The gear starts hidden until its switch is on (ADR-005)');
for(const choice of ['light','dark','system'])assert(html.includes(`data-theme-choice="${choice}"`));
for(const id of ['soundPreference','animationPreference'])assert(html.includes(`data-preference-mirror="${id}"`),`${id} has a Settings mirror`);
console.log('Site preferences passed: mirrored menu geometry, reversible mirror, body-only text scale, gear placement and default, theme/sound/animation controls.');
