import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL(`../dist/${name}`,import.meta.url),'utf8');
const [tokens,design,about,focus]=await Promise.all(['tokens.css','design-system.css','about-page.css','project-media-focus.css'].map(read));

// About and Contact space their heading as the home hero does: the same top, the same heading-to-text gap.
assert(tokens.includes('--space-hero-heading-gap: var(--space-4);'),'One token holds the hero heading-to-text gap');
assert(design.includes('.hero-about h1,.home-view-split .hero-about h1{margin:0 0 var(--space-hero-heading-gap)}'),'The hero uses it');
assert(about.includes(':is(.about-hero-copy,.lab-heading) .info-body{margin-top:var(--space-hero-heading-gap);'),'About and the Lab use it');
assert(about.includes('.info-detail:not(.about-detail)>h1+.info-body{margin-top:var(--space-hero-heading-gap);'),'Contact uses it');
assert(focus.includes('main.wide-project-hero:has(>.info-detail){padding-top:0}')&&focus.includes('main.wide-project-hero>.info-detail{padding-top:var(--page-content-top)}'),'By default they start at the page top the hero uses');
for(const space of ['roomy','spacious','grand','stage']){
 assert(focus.includes(`:root[data-hero-heading-space="${space}"] .home-canvas:not(.home-view-split) .home-hero{padding:var(--space-detail-heading-${space}) `),`The hero's ${space} preset`);
 assert(focus.includes(`:root[data-hero-heading-space="${space}"] main.wide-project-hero>.info-detail{padding-top:var(--space-detail-heading-${space})}`),`…is followed by About and Contact`);
}
console.log('Page hero spacing passed: About and Contact share the hero top (default and presets) and the heading-to-text gap token.');
