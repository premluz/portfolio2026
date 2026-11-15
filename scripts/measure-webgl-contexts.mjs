// WP-17 item 3: live WebGL contexts on home with every card mounted, per home layout, measured in one process.
// Usage: start `PORT=3919 HOST=127.0.0.1 node deploy/node-server.mjs --dev`, then `node scripts/measure-webgl-contexts.mjs [baseUrl]`.
// --dev matters: without it the server serves the built dist/client copy, not the sources (FACT-012).
import {chromium} from '@playwright/test';
// `--effects` also turns on the card ripple and blur, both off by default; only they give cards a WebGL renderer.
const EFFECTS=process.argv.includes('--effects');
const BASE=process.argv.slice(2).find(arg=>!arg.startsWith('--'))??'http://127.0.0.1:3919';
// View and layout only exist in the cards display (app.js hides their selects otherwise), so 11 home layouts in all.
const VIEWS=['current','flip','flat'],LAYOUTS=['masonry','regular','alternating'];
const HOMES=[{display:'carousel'},{display:'text'},...VIEWS.flatMap(view=>LAYOUTS.map(layout=>({display:'cards',view,layout})))];
const SCROLL_STEPS=12;

// Runs before any page script: tags each WebGL context with the module that asked for it, and tracks losses.
function trackContexts(){
 const live=new Map();let created=0;const byModule={};
 const original=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...rest){
  const context=original.call(this,type,...rest);
  if(!context||!/webgl/.test(type)||live.has(context))return context;
  const caller=(new Error().stack.split('\n').slice(2).find(line=>!/three|getContext/.test(line))??'').match(/\/([\w-]+\.js)/)?.[1]??'unknown';
  created++;byModule[caller]=(byModule[caller]??0)+1;live.set(context,caller);
  this.addEventListener('webglcontextlost',()=>live.delete(context));
  const lose=context.getExtension('WEBGL_lose_context');
  if(lose){const loseContext=lose.loseContext.bind(lose);lose.loseContext=()=>{live.delete(context);loseContext();};}
  return context;
 };
 window.__webgl=()=>{const liveByModule={};for(const caller of live.values())liveByModule[caller]=(liveByModule[caller]??0)+1;return {created,live:live.size,byModule,liveByModule};};
}

// Card renderers are built lazily by motion (motion-material.js setMotion), which scroll velocity drives;
// an instant scrollTo has no velocity, so this scrolls with the wheel, down then back up.
async function mountEveryCard(page){
 let peak=0;
 const height=await page.evaluate(()=>document.scrollingElement.scrollHeight-innerHeight);
 const step=Math.max(1,Math.ceil(height/SCROLL_STEPS));
 for(const direction of [1,-1])for(let i=0;i<SCROLL_STEPS;i++){
  await page.mouse.move(720,450);
  for(let tick=0;tick<6;tick++){await page.mouse.wheel(0,direction*step/6);await page.waitForTimeout(16);}
  await page.waitForTimeout(250);
  for(const box of await page.$$eval('main .visual',nodes=>nodes.map(n=>n.getBoundingClientRect()).filter(r=>r.width>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth).map(r=>({x:r.x+r.width/2,y:r.y+r.height/2})))){
   await page.mouse.move(box.x,box.y,{steps:4});await page.mouse.move(box.x+40,box.y+20,{steps:4});
  }
  await page.waitForTimeout(150);
  peak=Math.max(peak,(await page.evaluate(()=>window.__webgl())).live);
 }
 return peak;
}

const browser=await chromium.launch();
// Sets a select the way a visitor does and waits for the home reflow to finish.
async function choose(page,id,value){
 await page.evaluate(([selectId,next])=>{const select=document.getElementById(selectId);select.value=next;select.dispatchEvent(new Event('change',{bubbles:true}));},[id,value]);
 await page.waitForTimeout(1500);
}

for(const {display,view,layout} of HOMES){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(trackContexts);
 const page=await context.newPage();const warnings=[];
 page.on('console',message=>{if(/WebGL/i.test(message.text()))warnings.push(message.text().slice(0,120));});
 const boot=async()=>{await page.goto(BASE+'/',{waitUntil:'load'});await page.waitForFunction(()=>!document.documentElement.classList.contains('page-booting'));await page.waitForTimeout(1200);};
 await boot();
 // A fresh profile imports the published settings over storage (site-settings.js) and resets retired keys
 // (default-settings.js), so effect keys only hold once the first boot has recorded both; then reload.
 if(EFFECTS){await page.evaluate(()=>{localStorage.setItem('prem-image-ripple-enabled','true');localStorage.setItem('prem-image-blur-enabled','true');});await boot();
  const on=await page.evaluate(()=>[document.getElementById('imageRippleEnabled')?.checked,document.getElementById('imageBlurEnabled')?.checked].join('/'));
  if(on!=='true/true')throw Error(`Image effects did not turn on: ripple/blur controls show ${on}`);}
 if(display!=='carousel')await choose(page,'homeProductDisplay',display);
 if(view)await choose(page,'homeViewSelect',view);
 if(layout)await choose(page,'homeLayoutSelect',layout);
 const atLoad=await page.evaluate(()=>window.__webgl());
 let peakLive=await mountEveryCard(page);
 // A reflow moves every card at once; repeated after all images have loaded, it shows whether contexts scale with cards.
 if(layout){const other=LAYOUTS.find(name=>name!==layout);await choose(page,'homeLayoutSelect',other);peakLive=Math.max(peakLive,(await page.evaluate(()=>window.__webgl())).live);await choose(page,'homeLayoutSelect',layout);peakLive=Math.max(peakLive,(await page.evaluate(()=>window.__webgl())).live);}
 const cards=await page.$$eval('main .visual',nodes=>nodes.length);
 // Proves the settings took: the app writes its live state back into these selects.
 const ids=view?['homeProductDisplay','homeViewSelect','homeLayoutSelect']:['homeProductDisplay'];
 const applied=await page.evaluate(list=>list.map(id=>document.getElementById(id)?.value).join('/'),ids);
 const asked=[display,view,layout].filter(Boolean).join('/');
 if(applied!==asked)throw Error(`Home settings did not apply: asked ${asked}, page shows ${applied}`);
 const end=await page.evaluate(()=>window.__webgl());
 console.log(JSON.stringify({effects:EFFECTS,display,view,layout,applied,cards,liveAtLoad:atLoad.live,peakLive,liveAtEnd:end.live,created:end.created,liveByModule:end.liveByModule,createdByModule:end.byModule,warnings:[...new Set(warnings)]}));
 await context.close();
}
await browser.close();
