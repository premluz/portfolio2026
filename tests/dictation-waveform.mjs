import assert from 'node:assert/strict';
import {mountDictationWaveform} from '../dist/dictation-waveform.js';
const bar=()=>({style:{setProperty(k,v){this[k]=v;}},cloneNode:()=>bar()});
const track={children:[],append(...nodes){this.children.push(...nodes);}};
globalThis.document={createElement:()=>track};const bars=Array.from({length:28},bar),node={children:bars,append(n){this.track=n;}};
const wave=mountDictationWaveform(node);assert.equal(track.children.length,56,'Both halves of the moving ticker have identical counts');wave.setLevel(0);
assert(track.children.every(n=>n.style['--voice-bar-height']==='2px'),'Silence stays a calm dot baseline');wave.setLevel(1);assert.equal(track.children[27].style['--voice-bar-height'],'26px');assert.equal(track.children[55].style['--voice-bar-height'],'26px','Both copies reflect incoming microphone audio');
wave.setLevel(NaN);assert.equal(track.children[27].style['--voice-bar-height'],'2px');assert.equal(track.children[26].style['--voice-bar-height'],'26px','The level history advances continuously across the input');
console.log('Dictation waveform passed: duplicated ticker, silent baseline, real levels and matching history copies.');
