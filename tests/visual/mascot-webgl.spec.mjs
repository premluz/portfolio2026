import {test,expect} from '@playwright/test';

const agent=page=>page.locator('.agent');
const ready=async page=>{
 await page.goto('/?dev=1',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await page.evaluate(()=>{
  for(const id of ['showMascot','characterAssistant','navShowWork']){
   const input=document.getElementById(id);input.checked=true;input.dispatchEvent(new Event('change'));
  }
  const position=document.getElementById('navPosition');position.value='bottom';position.dispatchEvent(new Event('change'));
 });
 await expect(agent(page)).toHaveAttribute('data-state','home',{timeout:15000});
};
const webgl=async page=>{
 await ready(page);
 await expect(agent(page)).toHaveAttribute('data-renderer','webgl');
 await expect(agent(page).locator('canvas')).toBeVisible();
};

for(const width of [1440,375])test(`WebGL mascot preserves dock and assistant placement at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:900});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await webgl(page);
 const root=agent(page),fallback=root.locator('.agent-fallback');
 await expect(fallback).toHaveCSS('visibility','hidden');
 await expect(root.locator('.agent-live')).toHaveCSS('pointer-events','none');
 const sizes=()=>root.evaluate(node=>{
  const stage=node.querySelector('.mascott-stage'),canvas=node.querySelector('canvas');
  return [node.offsetWidth,stage.offsetWidth,canvas.offsetWidth,node.querySelector('mascott-embed').config.placement.size];
 });
 await expect.poll(sizes).toEqual([72,144,144,72]);
 await expect.poll(()=>root.locator('canvas').evaluate(canvas=>JSON.parse(canvas.dataset.pose).material)).toBe('gloss');
 await root.screenshot({path:info.outputPath(`mascot-${width}.png`)});
 await root.click();
 await expect(page.locator('#askPage')).toBeVisible();
 await expect(page.locator('#assistantMascot')).toBeVisible();
 await expect.poll(sizes).toEqual([144,288,288,144]);
 await expect.poll(()=>root.evaluate(node=>{
  const at=node.getBoundingClientRect(),stage=document.querySelector('#assistantMascot').getBoundingClientRect();
  return Math.hypot(at.x+at.width/2-stage.x-stage.width/2,at.y+at.height/2-stage.y-stage.height/2);
 })).toBeLessThan(1);
 await page.evaluate(()=>{
  const input=document.querySelector('#showMascot');input.checked=false;input.dispatchEvent(new Event('change'));
 });
 await expect(root).toBeHidden();
 expect(errors).toEqual([]);
});

test('PNG remains visible when the bundle cannot load',async({page})=>{
 await page.route('**/vendor/mascott/mascott-embed.js',route=>route.abort());
 await ready(page);
 await expect(agent(page)).toHaveAttribute('data-renderer','png');
 await expect(agent(page).locator('.agent-fallback')).toBeVisible();
 await expect(agent(page).locator('.agent-fallback')).toHaveAttribute('src','assets/agent.png');
 await agent(page).click();await expect(page.locator('#askPage')).toBeVisible();
});

test('PNG remains visible without WebGL',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   return type.startsWith('webgl')?null:original.call(this,type,...args);
  };
 });
 await ready(page);
 await expect(agent(page).locator('.mascott-stage')).toHaveAttribute('data-status','unsupported');
 await expect(agent(page)).toHaveAttribute('data-renderer','png');
 await expect(agent(page).locator('.agent-fallback')).toBeVisible();
});

test('context loss shows the PNG and context restoration returns WebGL',async({page})=>{
 await webgl(page);
 await page.evaluate(()=>{
  const canvas=document.querySelector('.agent canvas');
  window.mascotContext=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
  window.mascotContext.loseContext();
 });
 await expect(agent(page)).toHaveAttribute('data-renderer','png');
 await expect(agent(page).locator('.agent-fallback')).toBeVisible();
 await page.evaluate(()=>window.mascotContext.restoreContext());
 await expect(agent(page)).toHaveAttribute('data-renderer','webgl');
 await expect(agent(page).locator('.agent-fallback')).toHaveCSS('visibility','hidden');
});

test('portfolio animation switch stops the component and reduced motion remains respected',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await webgl(page);
 const config=()=>agent(page).locator('mascott-embed').evaluate(element=>element.config);
 expect((await config()).behaviour.reducedMotion).toBe('respect');
 await page.evaluate(()=>{document.documentElement.dataset.animation='off';});
 await expect.poll(async()=> (await config()).behaviour).toEqual({follow:'none',alive:false,reducedMotion:'respect'});
 expect((await config()).look.motion).toBe('still');
 await expect(agent(page).locator('.agent-fallback')).toHaveCSS('animation-name','none');
});
