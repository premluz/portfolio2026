import {test,expect} from '@playwright/test';

async function ready(page){
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#homeProductDisplay').evaluate(input=>{
  input.value='cards';input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 return page.locator('.gallery-grid .project-card').first();
}
const timing=card=>card.evaluate(element=>{
 const style=getComputedStyle(element);
 return {duration:style.transitionDuration,ease:style.transitionTimingFunction,property:style.transitionProperty};
});
const settle=card=>card.evaluate(async element=>{
 await new Promise(requestAnimationFrame);
 for(const animation of element.getAnimations())if(animation instanceof CSSTransition)animation.finish();
 await new Promise(requestAnimationFrame);
 return getComputedStyle(element).transform;
});

test('card hover and press use softer independent timing even with instant surface hover',async({page})=>{
 const card=await ready(page);await card.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 await page.evaluate(()=>document.documentElement.dataset.hoverInstant='on');
 expect(await timing(card)).toEqual({duration:'0.36s',ease:'cubic-bezier(0.33, 1, 0.68, 1)',property:'transform'});
 await card.hover();expect(await timing(card)).toEqual({duration:'0.3s',ease:'cubic-bezier(0.4, 0, 0.2, 1)',property:'transform'});
 expect(await settle(card)).toBe('matrix(0.985, 0, 0, 0.985, 0, 0)');
 await page.mouse.down();expect(await timing(card)).toEqual({duration:'0.16s',ease:'cubic-bezier(0.2, 0.8, 0.2, 1)',property:'transform'});
 expect(await settle(card)).toBe('matrix(0.97, 0, 0, 0.97, 0, 0)');
 await page.mouse.move(0,0);await page.mouse.up();
 expect((await timing(card)).duration).toBe('0.36s');expect(await settle(card)).toBe('none');
});

test('card scale feedback stays disabled for reduced motion and Animation Off',async({page})=>{
 const card=await ready(page);await page.emulateMedia({reducedMotion:'reduce'});
 await card.hover();expect(await settle(card)).toBe('none');
 await page.mouse.down();expect(await settle(card)).toBe('none');await page.mouse.move(0,0);await page.mouse.up();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>document.documentElement.dataset.animation='off');
 await card.hover();expect(await settle(card)).toBe('none');
});
