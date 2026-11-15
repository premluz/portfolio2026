// WP-17 item 4: how often each featured stage reveals over three passes of the home page, measured in one process.
// Usage: start `PORT=3919 HOST=127.0.0.1 node deploy/node-server.mjs --dev`, then
// `node scripts/measure-stage-reveal.mjs [baseUrl] [--once]`; `--once` turns on prem-stage-reveal-once.
// --dev matters: without it the server serves the built dist/client copy, not the sources (FACT-012).
import {chromium} from '@playwright/test';
const ONCE=process.argv.includes('--once');
const BASE=process.argv.slice(2).find(arg=>!arg.startsWith('--'))??'http://127.0.0.1:3919';
const PASSES=[1,0,1],STEPS=16;

// Sets a control the way a visitor does (FACT-013) and waits for the home reflow.
async function toggle(page,id,checked){
 const found=await page.evaluate(([inputId,on])=>{const input=document.getElementById(inputId);if(!input)return false;input.checked=on;input.dispatchEvent(new Event('change',{bubbles:true}));return true;},[id,checked]);
 if(!found)throw Error(`Control #${id} is missing`);
 await page.waitForTimeout(1500);
}

async function scrollPass(page,target){
 const from=await page.evaluate(()=>scrollY/(document.scrollingElement.scrollHeight-innerHeight));
 for(let i=1;i<=STEPS;i++){
  await page.evaluate(f=>window.scrollTo({top:(document.scrollingElement.scrollHeight-innerHeight)*f,behavior:'instant'}),from+(target-from)*i/STEPS);
  await page.waitForTimeout(200);
 }
}

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(BASE+'/',{waitUntil:'load'});
await page.waitForFunction(()=>!document.documentElement.classList.contains('page-booting'));await page.waitForTimeout(1200);
await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});});
await page.evaluate(()=>{const select=document.getElementById('homeProductDisplay');select.value='cards';select.dispatchEvent(new Event('change',{bubbles:true}));});
await page.waitForTimeout(1500);
await toggle(page,'featureStage',true);
if(ONCE)await toggle(page,'stageRevealOnce',true);
// Counts each move into view: the moment a stage gains data-stage-in-view, which starts its reveal transition.
await page.evaluate(()=>{window.__reveals={};new MutationObserver(records=>{for(const record of records){const card=record.target;if(card.dataset.stageInView!=='true'||record.oldValue==='true')continue;const id=card.dataset.contentCard??card.dataset.card??'unknown';window.__reveals[id]=(window.__reveals[id]??0)+1;}}).observe(document.querySelector('main'),{subtree:true,attributes:true,attributeFilter:['data-stage-in-view'],attributeOldValue:true});});
const stages=await page.$$eval('.image-card[data-feature-stage="true"]',cards=>cards.length);
if(!stages)throw Error('No featured stages rendered; the Featured stage setting did not apply');
for(const target of PASSES)await scrollPass(page,target);
const reveals=await page.evaluate(()=>window.__reveals);
const counts=Object.values(reveals);
console.log(JSON.stringify({once:ONCE,stages,passes:PASSES.length,stagesRevealed:counts.length,totalReveals:counts.reduce((a,b)=>a+b,0),maxPerStage:Math.max(0,...counts),perStage:reveals}));
await browser.close();
