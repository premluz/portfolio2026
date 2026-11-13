import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HERO_LOGOS,HERO_LOGO_COPIES,heroLogosMarkup} from '../dist/hero-logos.js';
import {HOME_SECTION_DEFAULTS} from '../dist/home-sections.js';
import {homeHero,heroCopyMarkup} from '../dist/home-content.js';
import {clientStyles} from '../scripts/client-styles.mjs';

assert.equal(HOME_SECTION_DEFAULTS.logos,false,'The logo strip starts off (ADR-005)');
for(const logo of HERO_LOGOS){
 const svg=fs.readFileSync(new URL(`../dist/assets/logos/${logo.file}`,import.meta.url),'utf8');
 const [,,width,height]=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
 assert.deepEqual([logo.width,logo.height],[width,height],`${logo.file} reserves its own size`);
}
const markup=heroLogosMarkup();
assert.equal(markup.match(/<ul class="hero-logos-set"/g).length,HERO_LOGO_COPIES,'Every copy is rendered');
assert.equal(markup.match(/aria-hidden="true"/g).length,HERO_LOGO_COPIES-1,'Only the first copy is announced');
assert.equal(markup.match(/alt="[^"]+"/g).length,HERO_LOGOS.length,'Each company is named once');
assert.equal(heroLogosMarkup([]),'','No logos, no strip');

// Flip and Flat views replace the hero copy's children on scroll, so the strip must follow it, not live inside it.
for(const heroContent of ['timeline','paragraph'])assert(homeHero({heroContent}).includes(`<div class="hero-copy" data-hero-copy>${heroCopyMarkup(heroContent)}</div>${markup}`),'The strip sits right under the hero copy, outside it');

const css=fs.readFileSync(new URL('../dist/hero-logos.css',import.meta.url),'utf8');
assert(css.includes(`calc(-100% / ${HERO_LOGO_COPIES})`),'The loop moves exactly one copy, matching HERO_LOGO_COPIES');
assert(/prefers-reduced-motion:no-preference\)\{\s*\.hero-logos-track\{animation/.test(css),'Motion only runs without a reduced-motion preference');
assert(clientStyles.includes('hero-logos.css'),'The stylesheet ships in site.css');
console.log('Hero logos passed: off by default, reserved sizes, seamless copies, accessible names, placement outside the hero copy, reduced motion.');
