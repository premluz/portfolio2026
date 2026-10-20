import {test,expect} from '@playwright/test';

// A page transition that throws part-way must not strand the page inert in its transition state: it is
// reported, and the requested page appears without animation and keeps working.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';

test('a failing transition still lands on a working page',async({page})=>{
 const reported=[];page.on('console',message=>{if(message.type()==='error')reported.push(message.text());});
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.evaluate(()=>{const animate=Element.prototype.animate;let calls=0;Element.prototype.animate=function(...args){if(++calls===1)throw new Error('injected transition failure');return animate.apply(this,args);};});
 const link=page.locator(CENTRED).locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
 await link.click();
 await expect(page).toHaveURL(new RegExp(`#${id}$`));
 await expect(page.locator('html')).not.toHaveClass(/route-transition/);
 await expect(page.locator('body')).not.toHaveClass(/in-motion/);
 await expect(page.locator('.detail')).toBeVisible();
 await expect(page.locator('.motion-viewport,.retained-home')).toHaveCount(0);
 expect(reported.some(text=>text.includes('Page transition failed')&&text.includes('injected transition failure')),'the failure is reported').toBe(true);
 await page.keyboard.press('Escape');
 await expect(page).not.toHaveURL(new RegExp(`#${id}$`));
 await expect(page.locator(CENTRED)).toBeVisible();
});
