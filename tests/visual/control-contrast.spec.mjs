import {test,expect} from '@playwright/test';

// WCAG 2.2 AA: 4.5:1 for text below large size and 3:1 for icons (1.4.3, 1.4.11). The label or icon identifies
// each control, so no edge contrast is required and none is added.
const TEXT_RATIO=4.5,ICON_RATIO=3;
// A freshly started test server can still be preparing the page when the first spec loads it.
const BOOT_TIMEOUT=20000;
const variants=['ghost','outline','glass'];
const headerControls=[
 {name:'Go Back',selector:'[data-header-action="back"]',minimum:TEXT_RATIO},
 {name:'Previous icon',selector:'[data-header-action="previous"]',minimum:ICON_RATIO},
 {name:'current link',selector:'#dock nav a.active',minimum:TEXT_RATIO},
 {name:'idle link',selector:'#dock nav a:not(.active):not([hidden])',minimum:TEXT_RATIO},
 {name:'Settings icon',selector:'#sitePreferencesToggle',minimum:ICON_RATIO}
];
const menuControls=[
 {name:'menu label',selector:'.site-settings-menu .setting-label',minimum:TEXT_RATIO},
 {name:'menu option',selector:'.site-settings-menu .theme-options button:not(.active)',minimum:TEXT_RATIO},
 {name:'selected option',selector:'.site-settings-menu .theme-options button.active',minimum:TEXT_RATIO}
];
const settle=page=>page.evaluate(async()=>{
 await new Promise(requestAnimationFrame);
 for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();
 await new Promise(requestAnimationFrame);
});
const glassImage=page=>page.locator('#dock>.dock-glass').evaluate(element=>getComputedStyle(element).backgroundImage);

async function open(page,route){
 await page.goto('/?dev=1#'+route,{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:BOOT_TIMEOUT});
 await expect(page.locator('#dock')).toHaveClass(/control-container/);
}
async function prepare(page,{variant,theme='light',alwaysDark=false}){
 await page.evaluate(([variant,theme,alwaysDark])=>{
  const input=document.querySelector('#controlStyle');input.value=variant;input.dispatchEvent(new Event('change',{bubbles:true}));
  document.documentElement.dataset.theme=theme;
  for(const element of [document.documentElement,document.querySelector('#dock')])element.classList.toggle('always-dark-glass',alwaysDark);
 },[variant,theme,alwaysDark]);
 await page.mouse.move(0,0);await settle(page);
}
async function setMenu(page,shown){
 const toggle=page.locator('#sitePreferencesToggle');
 if((await toggle.getAttribute('aria-expanded')==='true')!==shown)await toggle.click();
 await (shown?expect(page.locator('#sitePreferencesMenu')).toBeVisible():expect(page.locator('#sitePreferencesMenu')).toBeHidden());
 await page.mouse.move(0,0);await settle(page);
}
// Shared by the label and edge checks: both run in the page.
const luminanceSource=`rgb=>{const [red,green,blue]=rgb.map(value=>{const unit=value/255;return unit<=.03928?unit/12.92:((unit+.055)/1.055)**2.4;});return .2126*red+.7152*green+.0722*blue;}`;
// The ink is read from computed style; the background is the pixels really painted behind the hidden glyphs.
// Only the middle of the box is averaged: the corners of a rounded control show the page, not its surface.
async function contrast(page,selector){
 const control=page.locator(selector).first();await expect(control).toBeVisible();
 const ink=await control.evaluate(element=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const context=canvas.getContext('2d');context.fillStyle=getComputedStyle(element).color;context.fillRect(0,0,1,1);
  const [red,green,blue,alpha]=context.getImageData(0,0,1,1).data;let opacity=alpha/255;
  for(let node=element;node;node=node.parentElement)opacity*=Number(getComputedStyle(node).opacity);
  element.dataset.contrastProbe='';
  return {rgb:[red,green,blue],opacity};
 });
 const hide=await page.addStyleTag({content:'[data-contrast-probe],[data-contrast-probe] *{color:transparent!important;transition:none!important}[data-contrast-probe] svg{visibility:hidden!important}'});
 const shot=await control.screenshot();
 await hide.evaluate(node=>node.remove());
 await control.evaluate(element=>{delete element.dataset.contrastProbe;});
 return page.evaluate(async({data,ink,luminanceSource})=>{
  const luminance=(0,eval)(luminanceSource);
  const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d');context.drawImage(image,0,0);
  const left=Math.floor(image.width/4),top=Math.floor(image.height/4);
  const pixels=context.getImageData(left,top,Math.max(1,image.width-left*2),Math.max(1,image.height-top*2)).data,count=pixels.length/4,surface=[0,0,0];
  for(let index=0;index<pixels.length;index+=4)for(let channel=0;channel<3;channel++)surface[channel]+=pixels[index+channel]/count;
  const painted=ink.rgb.map((value,channel)=>value*ink.opacity+surface[channel]*(1-ink.opacity));
  const [lighter,darker]=[luminance(painted),luminance(surface)].sort((first,second)=>second-first);
  return (lighter+.05)/(darker+.05);
 },{data:shot.toString('base64'),ink,luminanceSource});
}
// Controls read by tone: the Outline edge is exactly the card edge, and the light fill carries no colour cast.
const edgeAndCast=(page,selector)=>page.locator(selector).first().evaluate(element=>{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true});
 const paint=colour=>{context.clearRect(0,0,1,1);context.fillStyle=colour;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data];};
 const style=getComputedStyle(element),fill=paint(style.backgroundImage.match(/rgba?\([^)]*\)|oklch\([^)]*\)/g).at(-1));
 return {edge:paint(style.borderTopColor).join(),cardEdge:paint(style.getPropertyValue('--image-edge')).join(),cast:Math.max(...fill.slice(0,3))-Math.min(...fill.slice(0,3))};
});
async function collect(page,label,controls,failures){
 for(const control of controls){
  const ratio=await contrast(page,control.selector);
  if(ratio<control.minimum)failures.push(`${label}: ${control.name} ${ratio.toFixed(2)}:1 < ${control.minimum}:1`);
 }
}

for(const theme of ['light','dark'])test(`${theme}-theme controls keep AA contrast in every variant, with and without always-dark glass`,async({page})=>{
 await open(page,'tracr');
 const failures=[];
 for(const alwaysDark of [true,false])for(const variant of variants){
  const label=`${variant}${alwaysDark?' + always-dark':''}`;
  await prepare(page,{variant,theme,alwaysDark});
  if(variant==='ghost')expect(await glassImage(page),'Ghost navigation is transparent at rest').toBe('none');
  await collect(page,label,headerControls,failures);
  await setMenu(page,true);
  if(variant==='ghost')expect(await glassImage(page),'An open menu gets a surface even in Ghost').not.toBe('none');
  await collect(page,label,menuControls,failures);
  await setMenu(page,false);
 }
 expect(failures).toEqual([]);
});

// One level of an 8-bit channel is the most the neutral card grey differs between channels.
const NEUTRAL_CAST=2;
test('controls share the card material: no edge stronger than the card edge, no colour cast, and arrows keep icon contrast',async({page})=>{
 await open(page,'work');
 const arrow='.card-rail-controls button:not(:disabled)';
 await page.locator(arrow).first().scrollIntoViewIfNeeded();
 const failures=[];
 for(const theme of ['light','dark'])for(const variant of variants){
  await prepare(page,{variant,theme});
  await collect(page,`${theme} ${variant}`,[{name:'carousel arrow',selector:arrow,minimum:ICON_RATIO}],failures);
  if(variant==='ghost')continue;
  const material=await edgeAndCast(page,arrow);
  if(variant==='outline')expect(material.edge,`${theme} Outline edge is the card edge`).toBe(material.cardEdge);
  if(theme==='light')expect(material.cast,`light ${variant} fill is neutral`).toBeLessThanOrEqual(NEUTRAL_CAST);
 }
 expect(failures).toEqual([]);
});

test('light Outline and Glass labels stay legible over a dark photograph',async({page})=>{
 await open(page,'tracr');
 // Worst case behind a light surface: solid black directly under the header controls.
 await page.addStyleTag({content:'body::before{content:"";position:fixed;inset:0 0 auto 0;height:240px;background:#000;z-index:0;pointer-events:none}'});
 const failures=[];
 for(const variant of ['outline','glass']){
  await prepare(page,{variant});
  await collect(page,variant+' over black',headerControls,failures);
 }
 expect(failures).toEqual([]);
});

test('the menu grows with the reader text size instead of clipping its last item',async({page})=>{
 await open(page,'work');
 for(const variant of variants){
  await prepare(page,{variant});await setMenu(page,true);
  for(const size of ['large','small','medium']){
   await page.locator(`[data-text-size-choice="${size}"]`).click();
   await expect.poll(()=>page.evaluate(()=>{
    const nav=document.querySelector('#dock .dock-content>nav').getBoundingClientRect();
    const items=[...document.querySelectorAll('#dock .dock-content>nav>*')].filter(item=>item.getClientRects().length&&getComputedStyle(item).position!=='absolute');
    return Math.round(Math.max(...items.map(item=>item.getBoundingClientRect().right))-nav.right);
   }),`${variant}, ${size} text: the last item ends inside the menu`).toBeLessThanOrEqual(0);
  }
  await setMenu(page,false);
 }
});
