import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
assert(css.includes('body.card-background-hidden .surface>.liquid-skin{box-shadow:none!important}'),'Hiding the card background also removes the card glass edge');
assert(css.indexOf('.surface>.liquid-skin,.flow-material,[data-theme=dark] .liquid-skin{box-shadow:var(--glass-edge)!important')<css.indexOf('body.card-background-hidden .surface>.liquid-skin{box-shadow:none!important}'),'The hidden-background rule comes after the edge it overrides');
console.log('Card background hidden passed: no card edge remains when the background is hidden.');
