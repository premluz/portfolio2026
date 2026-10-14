import assert from 'node:assert/strict';
import {heroViewportSpace,fitHeroToViewport} from '../dist/hero-viewport.js';
for(const viewport of [500,600,720,900]){
 const content=280,gap=60,top=0,space=heroViewportSpace({viewport,content,gap,top});
 assert(space>=0);assert(top+content+gap+2*space<=viewport-Math.min(220,viewport*.32)+.001,'Work stays visible whenever content itself fits');
}
assert.equal(heroViewportSpace({viewport:200,top:0,content:300}),0,'Very small windows remove surplus space without clipping text');
let padding=160,writes=0,split=false;
const style={getPropertyValue:()=>padding.toFixed(2)+'px',setProperty(key,value){padding=Math.min(160,parseFloat(value));writes++;},removeProperty(){padding=160;}};
const hero={style,getBoundingClientRect:()=>({top:-scrollY,bottom:340+padding*2-scrollY})};
const content={getBoundingClientRect:()=>({height:340})};
const image={getBoundingClientRect:()=>({top:340+padding*2+80-scrollY})};
const root={classList:{contains:()=>split},querySelector:s=>s==='.home-hero'?hero:s==='.hero-about'?content:s.includes('img')?image:null};
Object.assign(globalThis,{innerHeight:600,scrollY:0});fitHeroToViewport(root);assert.equal(padding,0);
const first=writes;fitHeroToViewport(root);assert.equal(writes,first,'Repeated sizing has no feedback drift');
globalThis.scrollY=220;fitHeroToViewport(root);assert.equal(padding,0,'Scrolling does not shrink or expand the hero');
globalThis.innerHeight=1100;fitHeroToViewport(root);assert.equal(padding,160,'A taller viewport restores generous spacing');
split=true;fitHeroToViewport(root);assert.equal(padding,160,'Sticky split layouts keep their own spacing');
console.log('Hero viewport passed: short-window card glimpse, natural text size, resize restoration, scroll stability and split layout isolation.');
