import {test,expect} from '@playwright/test';

const colour=locator=>locator.evaluate(element=>getComputedStyle(element).color);
const settle=page=>page.evaluate(async()=>{
 await new Promise(requestAnimationFrame);
 for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();
 await new Promise(requestAnimationFrame);
});

for(const effect of ['reveal','reveal-soft','tint','glow'])test(`card secondary rows retain their faint colour with ${effect}`,async({page})=>{
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#homeProductDisplay').evaluate(input=>{
  input.value='cards';input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.locator('#cardShowDescription').evaluate(input=>{
  input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.locator('#cardHoverEffect').evaluate((input,value)=>{
  input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));
 },effect);
 const cards=page.locator('.gallery-grid .project-card:has(.project-summary)');
 expect(await cards.count()).toBeGreaterThan(1);
 for(const theme of ['light','dark']){
  await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  for(const card of (await cards.all()).slice(0,2)){
   await card.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await settle(page);
   const summary=card.locator('.project-summary'),rest=await colour(summary);
   await card.hover();await settle(page);expect(await colour(summary)).toBe(rest);
   await page.mouse.move(0,0);await card.focus();await settle(page);expect(await colour(summary)).toBe(rest);
   await card.evaluate(element=>element.classList.add('gesture-hover'));
   await settle(page);expect(await colour(summary)).toBe(rest);
   await card.evaluate(element=>{element.classList.remove('gesture-hover');element.blur();});
  }
 }
});
