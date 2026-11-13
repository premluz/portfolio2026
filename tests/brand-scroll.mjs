import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=name=>readFile(new URL(`../dist/${name}`,import.meta.url),'utf8');
const [css,app,html,transfer]=await Promise.all(['design-system.css','app.js','index.html','settings-transfer.js'].map(read));

// The brand (avatar, name, description) scrolls with the page unless it is pinned; the menu is a separate fixed dock.
assert.equal(DEFAULT_STORAGE_VALUES['prem-pin-brand'],'false','By default the brand scrolls');
assert(app.includes("pinBrand=readFlag('prem-pin-brand')")&&app.includes("root.classList.toggle('brand-scrolls',!pinBrand)"),'Unpinned means the brand-scrolls class');
assert(app.includes("saveFlag('prem-pin-brand',pinBrand)"),'The choice persists');
assert(/<input id="pinBrand" type="checkbox">/.test(html),'The switch is in the panel, off');
assert(transfer.includes("pinBrand:'prem-pin-brand'"),'…and is exported with the other settings');
assert(css.includes(':root.brand-scrolls header{position:absolute;left:0;right:0;margin-inline:auto;transform:none}'),'The header sits at the top of the document, centred in the nav content width like the menu');
assert(css.includes(':root.brand-scrolls.assistant-sidebar-open header{left:0;right:var(--assistant-sidebar-width)}'),'…and beside the open assistant sidebar');
// Go Back and Previous/Next stay put: fixed, with the height they had inside the header (bottom:0 would reach the viewport bottom).
assert(css.includes(':root.brand-scrolls .header-detail-nav{position:fixed;left:calc((100vw - min(100vw, var(--nav-shell-width))) / 2 + var(--nav-gutter) - var(--space-3));bottom:auto;height:calc(var(--header-total) - var(--header-top-offset))}'),'Go Back keeps the header container offset');
console.log('Brand scroll passed: scrolls by default, pin switch persisted and exported, header in the document, detail navigation fixed.');
