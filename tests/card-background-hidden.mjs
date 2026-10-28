import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
assert(css.includes('body.card-background-hidden .surface:not(.detail)>.liquid-skin,body.page-card-background-hidden .surface.detail>.liquid-skin{box-shadow:none!important}'),'Hiding the card background (listing cards) or the page card background (pages) removes that card glass edge, each on its own');
assert(css.indexOf('.surface>.liquid-skin,.flow-material,[data-theme=dark] .liquid-skin{box-shadow:var(--glass-edge)!important')<css.indexOf('body.card-background-hidden .surface:not(.detail)>.liquid-skin,body.page-card-background-hidden .surface.detail>.liquid-skin{box-shadow:none!important}'),'The hidden-background rule comes after the edge it overrides');
console.log('Card background hidden passed: no card edge remains when the background is hidden.');
