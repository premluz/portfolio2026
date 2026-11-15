// WP-17.1 in-page measurement: CDP layout/style counters around each motion, single process.
// Usage: start `PORT=3919 HOST=127.0.0.1 node deploy/node-server.mjs --dev`, then `node scripts/measure-layout-motion.mjs [baseUrl]`.
// --dev matters: without it the server serves the built dist/client copy, not the sources.
import {chromium} from '@playwright/test';
const BASE=process.argv[2]??'http://127.0.0.1:3919';
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');
const m=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
async function measure(name,act,ms){
 await p.evaluate(()=>{window.__frames=[];let last=performance.now();const tick=t=>{window.__frames.push(t-last);last=t;if(!window.__stop)requestAnimationFrame(tick);};window.__stop=false;requestAnimationFrame(tick);});
 const a=await m();await act();await p.waitForTimeout(ms);const c=await m();
 const f=await p.evaluate(()=>{window.__stop=true;return window.__frames;});
 const d=k=>+(c[k]-a[k]).toFixed(1);const dur=k=>+((c[k]-a[k])*1000).toFixed(1);
 const s=[...f].sort((x,y)=>x-y);
 console.log(JSON.stringify({name,layouts:d('LayoutCount'),layoutMs:dur('LayoutDuration'),styleRecalcs:d('RecalcStyleCount'),styleMs:dur('RecalcStyleDuration'),frames:f.length,p95FrameMs:+s[Math.floor(s.length*.95)].toFixed(1),over20ms:f.filter(x=>x>20).length}));
}
await p.goto(BASE+'/',{waitUntil:'load'});
await p.waitForFunction(()=>!document.documentElement.classList.contains('page-booting'));await p.waitForTimeout(1500);
const card=p.locator(CENTRED);await card.scrollIntoViewIfNeeded();await p.waitForTimeout(600);
const link=card.locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
await measure('card open (flow-shell + afterglow)',()=>link.click(),1800);
await measure('card return (flow-shell)',()=>p.keyboard.press('Escape'),1800);
await p.waitForTimeout(800);
await p.keyboard.press('/');console.log('menu open',await p.locator('#projectMenu').isVisible());await p.waitForTimeout(700);
const rows=p.locator('#projectMenu [data-project-menu-item]');const n=Math.min(6,await rows.count());
await rows.nth(0).hover();await p.waitForTimeout(600);
await measure(`project menu hover across ${n} rows (preview + pill)`,async()=>{for(let i=1;i<n;i++){await rows.nth(i).hover();await p.waitForTimeout(260);}},400);
await p.waitForTimeout(500);
console.log('preview box',JSON.stringify(await p.evaluate(()=>{const e=document.querySelector('.project-menu-preview.is-visible');if(!e)return null;const r=e.getBoundingClientRect(),row=document.querySelectorAll('#projectMenu [data-project-menu-item]')[5].getBoundingClientRect();return {left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),rowMidY:Math.round(row.top+row.height/2),previewMidY:Math.round(r.top+r.height/2),translate:e.style.translate};})));
await b.close();
