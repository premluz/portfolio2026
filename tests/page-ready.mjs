import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../dist/page-boot.css',import.meta.url),'utf8');
const styles=await readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8');
assert(html.indexOf("classList.add('page-booting')")>0&&html.indexOf("classList.add('page-booting')")<html.indexOf('rel="stylesheet"'),'The cover class is set before the stylesheet paints');
assert(html.includes('BOOT_FAILSAFE_MS')&&html.includes("classList.remove('page-booting')"),'A failsafe lifts the cover if the app never reports ready');
assert(css.includes('html.page-booting::before{opacity:1;visibility:visible;transition:none}'),'The cover is opaque immediately while booting');
assert(styles.indexOf("'tokens.css'")<styles.indexOf("'page-boot.css'"),'The cover ships in the client bundle after the tokens');
assert(!/#[0-9a-f]{3,8}\b/i.test(css),'The cover colour is a token, not a hex value');


// Minimal browser surface for the module.
const classes=new Set(['page-booting']);
let fontsReady=Promise.resolve(),imagesQueried=false;
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
const root={get fonts(){return {ready:fontsReady};},querySelectorAll:()=>{imagesQueried=true;return [];},documentElement:{classList:{remove:name=>classes.delete(name)}}};
const {revealPage,PAGE_READY_TIMEOUT_MS}=await import('../dist/page-ready.js');

await revealPage({root});assert(!classes.has('page-booting'),'The cover lifts as soon as fonts are ready');
assert(!imagesQueried,'Images never hold the cover; they load behind the reveal');
assert(PAGE_READY_TIMEOUT_MS<=500,'The reveal is never held for long');

classes.add('page-booting');fontsReady=new Promise(()=>{});
const started=Date.now();await revealPage({root,timeout:30});
assert(!classes.has('page-booting')&&Date.now()-started<500,'Slow fonts cannot hold the cover past the cap');
console.log('Page ready passed: dark cover before paint, failsafe, token colour, text-only readiness and short cap.');
