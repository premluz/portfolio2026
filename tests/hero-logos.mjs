import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HERO_LOGOS,HERO_LOGO_COPIES,heroLogosMarkup,holdHeroLogoPhase,staggerHeroLogos} from '../dist/hero-logos.js';
import {DURATION} from '../dist/motion-tokens.js';
import {HOME_SECTION_DEFAULTS} from '../dist/home-sections.js';
import {homeHero,heroCopyMarkup} from '../dist/home-content.js';
import {clientStyles} from '../scripts/client-styles.mjs';

assert.equal(HOME_SECTION_DEFAULTS.logos,false,'The logo strip starts off (ADR-005)');
for(const logo of HERO_LOGOS){
 const svg=fs.readFileSync(new URL(`../dist/assets/logos/${logo.file}`,import.meta.url),'utf8');
 const [,,width,height]=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
 assert.deepEqual([logo.width,logo.height],[width,height],`${logo.file} reserves its own size`);
}
const markup=heroLogosMarkup();
assert.equal(markup.match(/<ul class="hero-logos-set"/g).length,HERO_LOGO_COPIES,'Every copy is rendered');
assert.equal(markup.match(/aria-hidden="true"/g).length,HERO_LOGO_COPIES-1,'Only the first copy is announced');
assert.equal(markup.match(/alt="[^"]+"/g).length,HERO_LOGOS.length,'Each company is named once');
assert.equal(heroLogosMarkup([]),'','No logos, no strip');

// Flip and Flat views replace the hero copy's children on scroll, so the strip must follow it, not live inside it.
for(const heroContent of ['timeline','paragraph'])assert(homeHero({heroContent}).includes(`<div class="hero-copy" data-hero-copy>${heroCopyMarkup(heroContent)}</div>${markup}`),'The strip sits right under the hero copy, outside it');

const css=fs.readFileSync(new URL('../dist/hero-logos.css',import.meta.url),'utf8');
assert(css.includes(`calc(-100% / ${HERO_LOGO_COPIES})`),'The loop moves exactly one copy, matching HERO_LOGO_COPIES');
assert(/prefers-reduced-motion:no-preference\)\{\s*\.hero-logos-track\{animation/.test(css),'Motion only runs without a reduced-motion preference');
assert(clientStyles.includes('hero-logos.css'),'The stylesheet ships in site.css');
// A DOM move restarts the CSS loop; the hold puts it back where it was, so the strip never snaps to its first logo.
const loop={animationName:'hero-logos-scroll',currentTime:4321},moved={animationName:'hero-logos-scroll',currentTime:0};
const track={animations:[loop],getAnimations(){return this.animations;}};
const resume=holdHeroLogoPhase({querySelectorAll:()=>[track]});
track.animations=[{animationName:'other',currentTime:0},moved];resume();
assert.equal(moved.currentTime,4321,'The restarted loop resumes at the phase it had before the move');
holdHeroLogoPhase({querySelectorAll:()=>[{getAnimations:()=>[]}]})();
for(const file of ['retained-home.js','home-return-stage.js']){
 const source=fs.readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8');
 assert.equal(source.match(/holdHeroLogoPhase\(/g).length,2,`${file} holds the loop phase on the way in and on the way back`);
}
// Visible logos stagger left to right; ones behind the strip's edge arrive with the last visible one.
const timings=new Map(),item=(name,left)=>({getBoundingClientRect:()=>({left,right:left+80}),animate:(frames,timing)=>{timings.set(name,{frames,timing});return {finished:Promise.resolve(name)};}});
const items=[item('third',300),item('first',10),item('hidden',2000),item('second',150)];
const strip={getBoundingClientRect:()=>({left:0,right:1000}),querySelectorAll:()=>items};
const tracked=[];const finished=staggerHeroLogos(strip,{delay:100,duration:200,track:animation=>{tracked.push(animation);return animation;}});
assert.equal(finished.length,items.length,'Every logo animates, so none is left hidden');
assert.equal(tracked.length,items.length,'Every logo animation is tracked by the transition');
const step=DURATION.staggerStep;
assert.deepEqual(['first','second','third','hidden'].map(name=>timings.get(name).timing.delay),[100,100+step,100+step*2,100+step*2],'Left to right, off-strip logos with the last');
assert.equal(timings.get('first').timing.fill,'backwards','Each logo stays hidden until its step begins');
assert.deepEqual(timings.get('first').frames,[{opacity:0},{opacity:1}],'Logos fade in');
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),retained=fs.readFileSync(new URL('../dist/retained-home.js',import.meta.url),'utf8');
assert(/fadeUpIn\(main\);if\(!reduce\.matches\)for\(const strip of main\.querySelectorAll\('\.hero-logos:not\(\[hidden\]\)'\)\)staggerHeroLogos\(/.test(app),'The first page load staggers the logos, except with reduced motion');
assert(retained.includes('if(node===logos)promises.push(...staggerHeroLogos('),'Going back home staggers the logos too');
console.log('Hero logos passed: off by default, reserved sizes, seamless copies, accessible names, placement outside the hero copy, reduced motion, loop phase kept across transitions, staggered arrival on load and return.');
