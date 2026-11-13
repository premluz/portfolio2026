import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// The longest testimonial sets its row's height. With text-wrap:pretty, Safari 26 can draw more lines than the grid
// measured, so the quote and its author overflowed the card; plain wrapping keeps measured and drawn lines the same.
const css=await readFile(new URL('../dist/home-sections.css',import.meta.url),'utf8');
const rule=css.match(/\.home-testimonial blockquote p\{[^}]*\}/)?.[0];
assert(rule,'The quote rule exists');
assert(rule.includes('text-wrap:wrap')&&!rule.includes('pretty'),'Testimonial quotes wrap plainly');
console.log('Testimonial wrap passed: quotes use plain wrapping so their card always holds them.');
