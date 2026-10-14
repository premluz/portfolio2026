import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {carouselControls,defaultCarouselSettings,normaliseCarouselSettings,readCarouselSettings,mountCarouselSettings,CAROUSEL_SETTINGS_KEY} from '../dist/carousel-settings.js';
import {circularArcPose,circularArcLayout,projectedCardBounds,circularGeometry} from '../dist/circular-card-gallery.js';

assert.deepEqual(readCarouselSettings({getItem:()=>null}),defaultCarouselSettings);
assert.deepEqual(readCarouselSettings({getItem(){throw Error('denied');}}),defaultCarouselSettings);
assert.deepEqual(readCarouselSettings({getItem:()=>'{bad'}),defaultCarouselSettings);
assert.equal(normaliseCarouselSettings({tilt:999}).tilt,60);assert.equal(normaliseCarouselSettings({depth:-2}).depth,0);assert.equal(normaliseCarouselSettings({spread:'120'}).spread,100);
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),section=html.slice(html.indexOf('<summary>Carousel</summary>'),html.indexOf('</details>',html.indexOf('<summary>Carousel</summary>')));
const inputs=new Map(),outputs=new Map();
for(const [key,control] of Object.entries(carouselControls)){
 assert.match(section,new RegExp(`data-carousel-control="${key}"[^>]*min="${control.min}"[^>]*max="${control.max}"`));
 inputs.set(key,{value:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}});outputs.set(key,{value:''});
}
const values=new Map([[CAROUSEL_SETTINGS_KEY,JSON.stringify({...defaultCarouselSettings,tilt:12})]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
const panel={querySelector(selector){const key=selector.match(/="([^"]+)"/)[1];return selector.includes('output')?outputs.get(key):inputs.get(key);}};
let allowed=true;const changes=[],mounted=mountCarouselSettings(panel,{storage,canChange:()=>allowed,onChange:settings=>changes.push(settings)});
assert.equal(inputs.get('tilt').value,'12');assert.equal(outputs.get('tilt').value,'12°');
inputs.get('spread').value='140';inputs.get('spread').handlers.input();assert.equal(changes.at(-1).spread,140);assert.equal(JSON.parse(values.get(CAROUSEL_SETTINGS_KEY)).spread,140);
allowed=false;inputs.get('gap').value='60';inputs.get('gap').handlers.input();assert.equal(inputs.get('gap').value,'32');assert.equal(changes.length,1,'Navigation guard restores the knob without changing geometry');
const copied=mounted.value;copied.tilt=99;assert.equal(mounted.value.tilt,12);
const base=circularArcPose(1,1000),tilted=circularArcPose(1,1000,{...defaultCarouselSettings,tilt:12}),spread=circularArcPose(1,1000,{...defaultCarouselSettings,spread:140}),flat=circularArcPose(1,1000,{...defaultCarouselSettings,depth:0});
assert(Math.abs(tilted.angle-base.angle/2)<.001);assert(Math.abs(spread.x-base.x*1.4)<.001);assert.equal(flat.z,0);assert.equal(flat.y,0);
const geometry=circularGeometry([700,700,700,360,700,360]),poses=circularArcLayout(geometry.angles.map(angle=>angle-geometry.angles[1]),1920*.68,[668,668,668,220,668,220],{viewportWidth:1920,settings:{...defaultCarouselSettings,gap:72}});
const edges=poses.map((pose,index)=>projectedCardBounds(pose,[668,668,668,220,668,220][index])).sort((a,b)=>a.left-b.left);
for(let i=1;i<edges.length;i++)assert(edges[i].left-edges[i-1].right>=72-.001,'Gap knob changes projected spacing');
for(const peek of [0,8,24]){
 const geometry=circularGeometry([310,160,310,160]),faces=[310,160,310,160],poses=circularArcLayout(geometry.angles,390*.68,faces,{compact:true,viewportWidth:390,settings:{...defaultCarouselSettings,peek}});
 assert(Math.abs(projectedCardBounds(poses[1],faces[1]).left-(195-peek))<.001,'Mobile peek knob moves the next image edge');
 assert(Math.abs(projectedCardBounds(poses[3],faces[3]).right+(195-peek))<.001,'Mobile peek knob moves the previous image edge');
}
console.log('Carousel settings passed: defaults, bounds, persistence, live controls, navigation guards, shallow tilt, spread, depth, gaps and mobile peeks.');
