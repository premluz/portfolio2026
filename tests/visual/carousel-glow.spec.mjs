import {test,expect} from '@playwright/test';

const GALLERY='[data-home-product-gallery] [data-gallery-variant="circular"]';
const SIZES={desktop:{width:1440,height:900},mobile:{width:390,height:844}};
const MOTION_FRAMES=36;

async function rotationStacking(layer,frameCount){
 const gallery=layer.closest('[data-card-gallery]'),viewport=gallery.querySelector('[data-gallery-viewport]');
 const positions=new Set(),cards=new Set(),failures=[];
 let overlaps=0,frames=0,diagnostic;
 viewport.focus({preventScroll:true});
 viewport.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 await new Promise(resolve=>{
  const sample=()=>{
   positions.add(Math.round(layer.getBoundingClientRect().left));
   for(const item of gallery.querySelectorAll('[data-gallery-front="true"]')){
    const rect=item.querySelector('.visual img').getBoundingClientRect();
    for(const fraction of [.2,.5,.8]){
     const x=rect.left+rect.width*fraction,y=rect.top+rect.height/2;
     if(x<0||x>=innerWidth||y<0||y>=innerHeight)continue;
     const stack=document.elementsFromPoint(x,y),fieldIndex=stack.indexOf(layer);
     const cardIndex=stack.findIndex(element=>element.closest('[data-gallery-item]')===item);
     diagnostic??={x,y,field:layer.getBoundingClientRect().toJSON(),pointer:getComputedStyle(layer).pointerEvents,stack:stack.map(element=>element.className)};
     if(fieldIndex<0||cardIndex<0)continue;
     overlaps++;cards.add(item);if(fieldIndex<cardIndex)failures.push({frame:frames,card:item.getAttribute('aria-label')});
    }
   }
   if(++frames<frameCount)requestAnimationFrame(sample);else resolve();
  };
  requestAnimationFrame(sample);
 });
 return {overlaps,cards:cards.size,failures,positions:positions.size,diagnostic};
}

function glowBounds(layer){
 const field=layer.getBoundingClientRect();
 const viewport=layer.closest('[data-card-gallery]').querySelector('[data-gallery-viewport]').getBoundingClientRect();
 const clippers=[];
 for(let parent=layer.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
  if(['hidden','clip','scroll','auto'].includes(getComputedStyle(parent).overflowY))clippers.push(parent.className);
 }
 return {above:field.top<viewport.top,below:field.bottom>viewport.bottom,clippers,
  pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
}

for(const [size,viewportSize] of Object.entries(SIZES))for(const moving of [true,false]){
 test(`${size} ${moving?'moving':'static'} carousel glow stays behind rotating cards without clipping`,async({page})=>{
  await page.setViewportSize(viewportSize);
  await page.addInitScript(movement=>{
   localStorage.setItem('prem-home-product-display','carousel');
   localStorage.setItem('prem-card-hover-effect','glow');
   localStorage.setItem('prem-hide-card-hover','false');
   localStorage.setItem('prem-ambient-light-movement',String(movement));
  },moving);
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/page-booting/);
  const viewport=page.locator(`${GALLERY} [data-gallery-viewport]`);
  const card=page.locator(`${GALLERY} [data-gallery-item][aria-current="true"] .project-card`);
  await expect.poll(()=>card.locator('img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  await card.hover();
  const field=page.locator(`${GALLERY} .surface-effect-layer.is-active:not([hidden])`);
  await expect.poll(()=>field.evaluate(layer=>Number(getComputedStyle(layer).opacity))).toBeGreaterThan(0);
  expect(await field.evaluate(layer=>layer.closest('[data-gallery-item]')),'Glow must not share an individual card stacking context').toBeNull();
  await expect(field.locator('..')).toHaveClass('spatial-gallery-ambient');
  await expect(viewport).toHaveCSS('overflow-x','clip');
  await expect(viewport).toHaveCSS('overflow-y','visible');
  await expect(viewport).toHaveCSS('touch-action','pan-y pinch-zoom');
  const bounds=await field.evaluate(glowBounds);
  expect(bounds.above).toBe(true);expect(bounds.below).toBe(true);
  expect(bounds.clippers,'No carousel ancestor cuts the visible glow vertically').toEqual([]);
  expect(bounds.pageWidth,'Glow must not create horizontal page scrolling').toBeLessThanOrEqual(bounds.viewportWidth);
  await card.evaluate(host=>{host.setAttribute('data-hover-persistent','');host.dispatchEvent(new Event('surface-hover-change'));});
  await page.mouse.move(0,0);
  await page.addStyleTag({content:'.spatial-gallery-ambient > .surface-effect-layer:not([hidden]){pointer-events:auto!important}'});
  const rotation=await field.evaluate(rotationStacking,MOTION_FRAMES);
  expect(rotation.overlaps,`Actual card/glow overlaps: ${JSON.stringify(rotation)}`).toBeGreaterThan(0);
  expect(rotation.cards,'Verify neighbours, not just the hovered card').toBeGreaterThan(1);
  expect(rotation.failures,'Every card must paint above the glow throughout rotation').toEqual([]);
  expect(rotation.positions,'The shared background still follows the hovered card').toBeGreaterThan(1);
 });
}
