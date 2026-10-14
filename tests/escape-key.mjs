import assert from 'node:assert/strict';
import {handleEscapeKey} from '../dist/escape-key.js';
let back=0,prevented=0;
const event=(key,{defaultPrevented=false,isComposing=false}={})=>({key,defaultPrevented,isComposing,preventDefault(){this.defaultPrevented=true;prevented++;}});
assert.equal(handleEscapeKey(event('Enter'),()=>back++),false);
assert.equal(handleEscapeKey(event('Escape',{defaultPrevented:true}),()=>back++),false,'An active modal can consume Escape first');
assert.equal(handleEscapeKey(event('Escape',{isComposing:true}),()=>back++),false,'IME composition remains uninterrupted');
const escape=event('Escape');assert.equal(handleEscapeKey(escape,()=>back++),true);assert(escape.defaultPrevented);assert.equal(back,1);assert.equal(prevented,1);
console.log('Escape key passed: focused controls, modal priority, IME handling and global back action.');
