import {test,expect} from '@playwright/test';

const GALLERY='[data-home-product-gallery] [data-gallery-variant="circular"]';
const SIZES={desktop:{width:1440,height:900},mobile:{width:390,height:844}};

function glowBounds(layer){
 const field=layer.getBoundingClientRect();
 const viewport=layer.closest('[data-gallery-viewport]').getBoundingClientRect();
 const clippers=[];
 for(let parent=layer.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
  if(['hidden','clip','scroll','auto'].includes(getComputedStyle(parent).overflowY))clippers.push(parent.className);
 }
 return {above:field.top<viewport.top,below:field.bottom>viewport.bottom,clippers,
  pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
}

for(const [size,viewportSize] of Object.entries(SIZES))for(const moving of [true,false]){
 test(`${size} ${moving?'moving':'static'} carousel glow escapes vertically`,async({page})=>{
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
  const field=card.locator(':scope > .surface-effect-layer.is-active');
  await expect.poll(()=>field.evaluate(layer=>Number(getComputedStyle(layer).opacity))).toBeGreaterThan(0);
  await expect(viewport).toHaveCSS('overflow-x','clip');
  await expect(viewport).toHaveCSS('overflow-y','visible');
  await expect(viewport).toHaveCSS('touch-action','pan-y pinch-zoom');
  const bounds=await field.evaluate(glowBounds);
  expect(bounds.above).toBe(true);expect(bounds.below).toBe(true);
  expect(bounds.clippers,'No carousel ancestor cuts the visible glow vertically').toEqual([]);
  expect(bounds.pageWidth,'Glow must not create horizontal page scrolling').toBeLessThanOrEqual(bounds.viewportWidth);
 });
}
