import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Phone sizing is token-driven: the saved Carousel size cannot shrink the card below a floor, margins and the card gap are tokens,
// and the hero and overview use a tighter rhythm. All of it lives in the <=600px blocks, so desktop keeps the saved settings.
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const [tokens,gallery]=await Promise.all([read('tokens.css'),read('card-gallery.css')]);
for(const token of ['gallery-mobile-inset-landscape','gallery-mobile-inset-portrait','gallery-mobile-gap','gallery-mobile-scale-floor'])assert(new RegExp(`--${token}: [^;]+;`).test(tokens),`--${token} is defined`);
const phone=gallery.match(/@media\(max-width:600px\)\{\.spatial-card-gallery\{[^@]*?\}\.spatial-gallery-viewport\{[^}]*\}/)?.[0]||'';
assert(phone.includes('--gallery-card-scale:max(var(--carousel-card-scale,1),var(--gallery-mobile-scale-floor))'),'The saved size is floored on phones');
assert(phone.includes('var(--gallery-mobile-inset-landscape)')&&phone.includes('var(--gallery-mobile-inset-portrait)')&&phone.includes('gap:var(--gallery-mobile-gap)'),'Margins and gap come from tokens');
assert(!/calc\(\(var\(--app-canvas-width\) - (48|64)px\)/.test(phone),'No literal margins remain in the phone block');
const desktop=gallery.slice(0,gallery.indexOf('@media(max-width:600px)'));
assert(!desktop.includes('gallery-mobile'),'Desktop rules do not use the phone tokens');
const block=tokens.slice(tokens.indexOf('@media (max-width: 600px)'));
assert(/--hero-gap: var\(--space-6\); --overview-column-gap: var\(--space-4\);/.test(block),'The vertical rhythm tightens inside the phone block');
console.log('Mobile carousel passed: size floor, tokenised margins and gap, desktop untouched, tighter hero and overview rhythm.');
