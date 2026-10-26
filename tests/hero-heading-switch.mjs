import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {homeHero} from '../dist/home-content.js';
import {HOME_SECTION_DEFAULTS} from '../dist/home-sections.js';

// The hero h1 is a Content Home section, on by default because it is shown today.
assert.equal(HOME_SECTION_DEFAULTS.heading,true);assert.equal(HOME_SECTION_DEFAULTS.available,true);
assert(homeHero({}).includes('<h1 data-hero-title data-home-section="heading">'),'The h1 carries the section hook');

// Split layouts write the active project's name into this h1, so the always-hide rule must exempt it there.
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const sections=await read('home-sections.css'),design=await read('design-system.css');
assert(sections.includes('[data-home-section][hidden]:not(.home-view-split [data-home-section="heading"])'),'The important hidden rule exempts the heading in split views');
assert(design.includes('.home-view-split .hero-about h1[hidden]{display:block}'),'Split views restore a hidden heading');
for(const page of ['index.html','lab.html'])assert((await read(page)).includes('data-home-section-control="heading" checked'),`${page} has the switch`);
console.log('Hero heading switch passed: default on, section hook, split layouts exempt, switch on both pages.');
