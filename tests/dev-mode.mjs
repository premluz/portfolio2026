import assert from 'node:assert/strict';
import {isDevMode,mountDevMode} from '../dist/dev-mode.js';

assert.equal(isDevMode('?dev=1'),true);
assert.equal(isDevMode('?foo=bar&dev=1'),true,'dev flag is found among other params');
for(const search of ['','?dev','?dev=0','?dev=true','?dev=','?xdev=1','?dev=10'])assert.equal(isDevMode(search),false,`${JSON.stringify(search)} stays public`);

const controls={hidden:true};
assert.equal(mountDevMode(controls,'?dev=0'),false);
assert.equal(controls.hidden,true,'Public visitors keep the utility controls hidden');
assert.equal(mountDevMode(controls,'?dev=1'),true);
assert.equal(controls.hidden,false,'?dev=1 reveals the utility controls');
