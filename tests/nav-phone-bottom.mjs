import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Phones keep the menu at the bottom whatever Position says; the saved choice stays and returns on wider screens.
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes("const phoneNav=matchMedia('(max-width:600px)');"),'Phones are the app\'s 600px breakpoint');
assert(app.includes("const effectiveNavPosition=()=>navPosition==='top'&&!phoneNav.matches?'top':'bottom';"));
assert.equal((app.match(/dataset\.navPosition=effectiveNavPosition\(\)/g)||[]).length,3,'The attribute CSS and modules read is the effective side: at boot, on resize across the breakpoint, and on a Position change');
assert(!/dataset\.navPosition=navPosition\b/.test(app),'The saved preference is never written to the attribute directly');
assert(app.includes("phoneNav.addEventListener('change',()=>{document.documentElement.dataset.navPosition=effectiveNavPosition();syncDockActions(current,{immediate:true});});"),'Crossing the breakpoint moves the menu and the project controls at once');
assert(app.includes("const headerDetail=route=>effectiveNavPosition()==='top'&&"),'On a phone, Go Back stays in the dock instead of the header');
assert.equal((app.match(/below:\(\)=>effectiveNavPosition\(\)==='top'/g)||[]).length,2,'Both menus open above a bottom dock on a phone');
assert(!/navPosition==='top'/.test(app.replace("navPosition==='top'&&!phoneNav.matches","")),'No other code reads the saved side as the shown side');
console.log('Nav phone bottom passed: phones show the menu at the bottom, the saved choice is kept, header swap and popovers follow.');
