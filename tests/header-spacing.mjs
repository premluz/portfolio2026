import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL(name.startsWith('scripts/')?'../'+name:'../dist/'+name,import.meta.url),'utf8');
const [tokens,design,empty,index,lab,styles]=await Promise.all(['tokens.css','design-system.css','empty-hero.css','index.html','lab.html','scripts/client-styles.mjs'].map(read));

// One offset token lowers the header, the top navigation and the hero's start together.
assert(/--header-top-offset: clamp\([^;]+\);/.test(tokens),'The offset is a token');
assert(tokens.includes('--header-total: calc(var(--header-height) + var(--header-top-offset));'),'The total header space includes it');
assert(tokens.includes('--dock-top: calc((var(--header-height) - var(--nav-height)) / 2 + var(--header-top-offset));'),'The top navigation sits lower by the same amount');
assert(design.includes('header{height:var(--header-total);padding-top:var(--header-top-offset)}'),'The header is taller by padding, so its content moves down');
assert(design.includes('+ var(--header-top-offset) + var(--hero-gap))'),'The hero still starts below the header content');
assert(design.includes('top:calc(var(--header-total) + var(--space-10))'),'The sticky split hero clears the taller header');

// The role line sits under the name, in the markup the hide-logo setting already hides.
for(const page of [index,lab])assert(page.includes('<span class="discipline"><span class="brand-name">Prem Luczak</span><span class="brand-role">Product designer &amp; builder</span></span>'),'Both pages show the role under the name');
assert(design.includes('.brand-role{'),'The role is styled');

// Empty hero: only with the carousel showing and no visible hero content, Current layout only, and the carousel takes over the header margin.
assert(styles.includes("'empty-hero.css'"),'The stylesheet ships in the bundle');
const rules=empty.split('\n').filter(line=>line.startsWith('main:'));
assert.equal(rules.length,2);
for(const rule of rules)for(const part of ['main:not(.home-view-split)','.home-product-carousel:not([hidden])',':not(:has(.hero-about>:is(.badge,h1,.hero-strapline):not([hidden])))',':not(:has(.hero-copy>*))',':not(:has(.home-overview:not([hidden])))'])assert(rule.includes(part),`Rule requires ${part}`);
assert(rules[0].endsWith('>.home-hero{display:none}'));
assert(rules[1].includes('margin-top:var(--header-total);min-height:calc(100svh - var(--header-total));display:grid;align-content:center'),'The carousel is centred below the header');
console.log('Header spacing passed: one offset token for header, nav and hero, role under the name, empty-hero centring scoped and header-aware.');
