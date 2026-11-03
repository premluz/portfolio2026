import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Go Back sits on the dock's own morphing glass and rim ("the icon has no second skin", portfolio-assistant.css). Every
// control style's surface skin (fill, border, shadow, blur) must skip it, or it paints a second, darker layer over the dock.
const styles=await readFile(new URL('../dist/control-style.css',import.meta.url),'utf8');
const skin=styles.split('\n').filter(line=>/^:root \.control-surface/.test(line)&&(line.includes('background:var(--control-fill)')||line.includes('background:var(--control-hover-fill)')));
assert(skin.length>=2,'The control surface skin and hover rules are present');
for(const line of skin){
 const selectors=line.slice(0,line.indexOf('{')).split(/,(?=:root)/);
 assert.equal(selectors.length,2,'Both the general and the dock selector are listed');
 for(const selector of selectors)assert(selector.includes('.control-surface:not(.assistant-back)'),`Go Back is excluded from: ${selector}`);
}
console.log('Dock back skin passed: the control-style surface rules skip Go Back in every selector.');
