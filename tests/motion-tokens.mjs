import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {EASE} from '../dist/motion-tokens.js';

const dist=new URL('../dist/',import.meta.url);
const tokens=await readFile(new URL('tokens.css',dist),'utf8');
for(const [role,curve] of Object.entries(EASE))assert(tokens.includes(`--ease-${role}: ${curve};`),`CSS --ease-${role} matches the JS token`);
// Stylesheets name a role instead of repeating a curve. Only the tokens themselves and the About illustrations'
// deliberate overshoot keep a literal curve.
const allowed={'tokens.css':Object.keys(EASE).length,'about-illustrations.css':1};
for(const file of (await readdir(dist)).filter(name=>name.endsWith('.css')&&name!=='site.css')){
 const count=((await readFile(new URL(file,dist),'utf8')).match(/cubic-bezier\(/g)||[]).length;
 assert.equal(count,allowed[file]||0,`${file} uses role variables, not literal curves`);
}
const css=(await Promise.all((await readdir(dist)).filter(name=>name.endsWith('.css')&&name!=='site.css').map(file=>readFile(new URL(file,dist),'utf8')))).join('\n');
for(const [,name] of css.matchAll(/var\(--ease-([a-z]+)\)/g)){assert(name in EASE,`--ease-${name} is a defined role`);}
assert(!/\.about-detail\{--ease-standard/.test(css),'--ease-standard is defined once for the whole site, not only on About');
console.log('Motion tokens passed: CSS and JS curves agree, stylesheets use roles, every role is defined.');
