import {test,expect} from '@playwright/test';

for(const width of [375,430])test(`mobile hero gaps match and next project peeks at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#homeProductDisplay').evaluate(input=>{
  input.value='carousel';input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 const geometry=await page.evaluate(async()=>{
  await document.fonts.ready;
  for(const animation of document.getAnimations())if(animation.effect.getComputedTiming().iterations!==Infinity)animation.finish();
  await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
  const gallery=document.querySelector('.home-product-carousel .spatial-card-gallery');
  const items=[...gallery.querySelectorAll('[data-gallery-item]')],first=items[0].getBoundingClientRect(),next=items[1].getBoundingClientRect();
  const hero=document.querySelector('.hero-about').getBoundingClientRect(),header=document.querySelector('.brand-avatar').getBoundingClientRect();
  return {above:hero.top-header.bottom,below:first.top-hero.bottom,peek:Math.min(innerWidth,next.right)-Math.max(0,next.left),firstWidth:first.width,viewport:innerWidth,heroTop:hero.top,headerBottom:header.bottom,heroPadding:getComputedStyle(document.querySelector('.home-hero')).paddingTop,headerHeight:getComputedStyle(document.querySelector('header')).height,headerPadding:getComputedStyle(document.querySelector('header')).paddingTop};
 });
 expect(geometry.above,JSON.stringify(geometry)).toBeCloseTo(geometry.below,0);
 expect(geometry.peek,JSON.stringify(geometry)).toBeGreaterThan(0);
 expect(geometry.peek).toBeLessThan(geometry.firstWidth);
});
