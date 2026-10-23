import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectPageExit,pageFadeExit,exitDuration,visibleExitText} from '../dist/project-page-exit.js';
import {EASE,DURATION,DISTANCE} from '../dist/motion-tokens.js';

globalThis.getComputedStyle=()=>({opacity:'1'});
const node=(name,top,height=20)=>({name,animations:[],getBoundingClientRect:()=>({top,bottom:top+height,height,left:0}),animate(frames,options){const a={frames,options,cancelled:false,finished:Promise.resolve(),cancel(){a.cancelled=true;}};this.animations.push(a);return a;}});
const textNodes=[node('title',100),node('summary',180),node('fact1',300),node('fact2',420),node('below',1400)];
const root={...node('main',-500,3000),style:{},querySelectorAll:()=>textNodes};

// Timing: exits are fast and always shorter than the entrance.
assert.equal(exitDuration(400),200);assert.equal(exitDuration(100),DURATION.exitMin);assert.equal(exitDuration(2400),DURATION.exitMax,'Even a slow transition setting keeps the exit quick');
assert(exitDuration(400)<400,'The exit is shorter than the page entrance');

// Only text the reader can see steps out, bottom-up, so the title leaves last.
assert.deepEqual(visibleExitText(root,{viewport:900}).map(n=>n.name),['fact2','fact1','summary','title']);

const exit=projectPageExit(root,{duration:400,viewport:900,viewportWidth:1440});
const delays=textNodes.slice(0,4).reverse().map(n=>n.animations[0].options.delay);
assert.deepEqual(delays,[...delays].sort((a,b)=>a-b),'Each visible line starts after the one below it');
assert.equal(textNodes[4].animations.length,0,'Text below the fold is left alone');
const page=root.animations[0];
assert.deepEqual(page.frames.at(-1),{opacity:0,transform:`translateY(${DISTANCE.exitDrop}px) scale(${DISTANCE.exitScale})`},'The page shrinks slightly and drops as it fades');
assert.equal(page.options.easing,EASE.leave,'Exits accelerate away');assert.equal(page.options.duration,200);
assert(textNodes.slice(0,4).every(n=>n.animations[0].options.delay+n.animations[0].options.duration<=page.options.duration+1),'The text stagger fits inside the page exit');
assert.equal(root.style.transformOrigin,'720px 950px','The page recedes towards the middle of the current view, even when scrolled');
exit.cancel();assert(root.animations[0].cancelled&&textNodes[0].animations[0].cancelled);assert.equal(root.style.transformOrigin,'','Cancelling restores the page');

// Many visible lines compress the stagger instead of dropping any.
const many=Array.from({length:12},(_,i)=>node('line'+i,40+i*60));
const busyRoot={...node('main',0,2000),style:{},querySelectorAll:()=>many};
projectPageExit(busyRoot,{duration:400,viewport:900,viewportWidth:1440});
assert(many.every(n=>n.animations.length===1),'Every visible line takes part');
assert(Math.max(...many.map(n=>n.animations[0].options.delay))<=200*DURATION.staggerSpan+1,'The stagger stays within its share of the exit');

assert.equal(projectPageExit(root,{reduced:true}),null,'Reduced motion skips the exit');
// Other pages fade in place with the same fast timing and curve.
const plain=node('about',0,900);const fade=pageFadeExit(plain,{duration:400});
assert.deepEqual(fade.frames,[{opacity:1},{opacity:0}],'Non-project pages only fade');assert.equal(fade.options.duration,exitDuration(400),'Every exit shares one timing');assert.equal(fade.options.easing,EASE.leave);
assert.equal(pageFadeExit(plain,{reduced:true}),null);
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes('exit=projectIds.includes(current)?projectPageExit(main,{duration}):pageFadeExit(leaving,{duration});'),'Projects recede, every other page fades, both on the shared exit timing');
assert(!app.includes('pageExitShare'),'The old separate exit timing is gone');
console.log('Project page exit passed: fast timing, visible-only bottom-up stagger, recede towards the current view, compressed stagger, cancel and reduced motion.');
