import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {badgeMarkup} from '../dist/badge.js';
import {homeHero} from '../dist/home-content.js';
import {contentModel} from '../dist/content/model.js';

assert.equal(badgeMarkup(null),'','No badge field renders nothing');
assert.equal(badgeMarkup({tone:'success'}),'','A badge needs a label');
assert.match(badgeMarkup({label:'Available',tone:'success'}),/<p class="badge" data-badge-tone="success"><span class="badge-dot" aria-hidden="true"><\/span><span class="badge-label">Available<\/span><\/p>/);
assert.match(badgeMarkup({label:'Away',tone:'error'}),/data-badge-tone="error"/);
assert.match(badgeMarkup({label:'x',tone:'neon'}),/data-badge-tone="success"/,'An unknown tone falls back to success');
assert(!badgeMarkup({label:'<img onerror=alert(1)>'}).includes('<img'),'Labels are escaped');

const hero=homeHero();
assert(hero.indexOf('class="badge"')>0&&hero.indexOf('class="badge"')<hero.indexOf('<h1'),'The badge sits above the heading');
assert(hero.includes('>Available<'),'The label comes from the home document');

const catalog=JSON.parse(await readFile(new URL('../content/catalog.json',import.meta.url),'utf8'));
const broken=structuredClone(catalog);broken.documents.find(doc=>doc.id==='home').badge={label:'x',tone:'neon'};
assert.throws(()=>contentModel.assert(broken),'Badge tones are limited to the status colours');
const css=await readFile(new URL('../dist/badge.css',import.meta.url),'utf8');
assert(css.includes('var(--status-success-accent)')&&css.includes('var(--status-error-accent)'),'Badge colours are the functional status tokens');
assert(!/#[0-9a-f]{3,8}\b/i.test(css),'Badge styles use no literal colours');
assert(css.includes('prefers-reduced-motion')&&css.includes('data-animation="off"'),'The pulse stops for reduced motion and animation off');
const styles=await readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8');assert(styles.includes("'badge.css'"),'Badge styles ship in the bundle');
// The Content Home switch hides the badge through data-home-section; without a section there is no hook.
assert.match(badgeMarkup({label:'Available'},{section:'available'}),/<p class="badge" data-home-section="available" data-badge-tone="success">/);
assert(!badgeMarkup({label:'Available'}).includes('data-home-section'),'No section, no attribute');
console.log('Badge passed: markup, escaping, tones, hero placement, content-driven label, schema, status tokens and reduced motion.');
