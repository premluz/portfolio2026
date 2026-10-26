import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {EASE,DISTANCE,BACKDROP} from '../dist/motion-tokens.js';
import {HERO_IMAGE_ENTRANCE_SCALE} from '../dist/hero-image-entrance.js';

const dist=new URL('../dist/',import.meta.url);
const tokens=await readFile(new URL('tokens.css',dist),'utf8');
for(const [role,curve] of Object.entries(EASE))assert(tokens.includes(`--ease-${role}: ${curve};`),`CSS --ease-${role} matches the JS token`);
// Scroll-driven motion lives in CSS, so its distances and scales are mirrored there and must stay equal.
for(const [name,value] of [['motion-lift',DISTANCE.lift+'px'],['hero-entrance-scale',String(HERO_IMAGE_ENTRANCE_SCALE).replace(/^0/,'')],['backdrop-enter-scale',String(BACKDROP.enterScale)]])
 assert(tokens.includes(`--${name}: ${value};`),`CSS --${name} matches its JS token (${value})`);
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
// Scripts name roles too: a literal curve outside the token module is a new, unnamed curve.
for(const file of (await readdir(dist)).filter(name=>name.endsWith('.js')&&name!=='motion-tokens.js')){
 assert(!(await readFile(new URL(file,dist),'utf8')).includes('cubic-bezier('),`${file} uses EASE roles, not literal curves`);
}
const tooltip=(await readFile(new URL('style.css',dist),'utf8')).match(/site-tooltip-arrive (\d+)ms/);
assert(tooltip&&Number(tooltip[1])<=250,'Tooltips are high-frequency, so their arrival stays at or under 250ms');
console.log('Motion tokens passed: CSS and JS curves agree, stylesheets and scripts use roles, every role is defined.');
