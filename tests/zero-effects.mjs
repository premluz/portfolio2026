import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

let frames=0;
globalThis.requestAnimationFrame=()=>++frames;globalThis.cancelAnimationFrame=()=>{};
globalThis.document??={querySelectorAll:()=>[]};
const {MotionMaterial}=await import('../dist/motion-material.js');
const {materialSettings,imageEffects}=await import('../dist/material-settings.js');

const saved={...materialSettings},savedBlur=imageEffects.blur;
let strength=0;const material=new MotionMaterial(()=>strength,()=>false);
Object.assign(materialSettings,{reflections:0,motionBlur:0});
material.start();assert.equal(frames,0,'Zero intensity, reflections and trail schedule no material frames');
assert.equal(await material.stop(),true,'Stopping an idle material settles at once');
strength=.5;material.start();assert.equal(frames,1,'Any liquid intensity starts the material loop');material.reset();
strength=0;materialSettings.reflections=10;material.start();assert.equal(frames,2,'Reflections alone still move the reflection layer');material.reset();
materialSettings.reflections=0;imageEffects.blur=true;materialSettings.motionBlur=40;material.start();assert.equal(frames,3,'An image trail alone still runs');material.reset();
imageEffects.blur=false;material.start();assert.equal(frames,3,'A disabled trail does not count as motion');material.reset();
Object.assign(materialSettings,saved);imageEffects.blur=savedBlur;

const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8'),environment=await readFile(new URL('../dist/environment.js',import.meta.url),'utf8');
assert(css.includes(':root[data-room-blur="off"] .has-room :is(.liquid-skin,.flow-material,.home-hero){backdrop-filter:none')&&environment.includes("dataset.roomBlur=v>0?'on':'off'"),'Zero background blur drops the backdrop layers');
console.log('Zero effects passed: idle material, per-effect starts and background blur shut off at zero.');
