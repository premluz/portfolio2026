import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

// Reduced motion draws every image through the plain image frame instead of the WebGL canvas, so frames are deterministic.
test.use({reducedMotion:'reduce',viewport:{width:1440,height:900}});

const SPECIMEN='/?dev=1#system';
const ITEMS=['card:specimen-long','card:specimen-tall','card:specimen-wide','card:specimen-square','card:specimen-text','card:specimen-bare','page:specimen-long','page:specimen-tall','page:specimen-wide','page:specimen-square','page:specimen-text','block:text','block:metric','block:quote','block:table','block:image-wide','block:image-tall'];
const SNAPSHOT_TOLERANCE=0.01;
const HIDE_CHROME=fileURLToPath(new URL('./system-specimen.hide-chrome.css',import.meta.url));

test('the specimen renders every component with zero console errors',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));
 page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
 await page.goto(SPECIMEN,{waitUntil:'load'});
 await expect(page.locator('[data-system-specimen]')).toBeVisible();
 await expect(page.locator('[data-specimen-item]')).toHaveCount(ITEMS.length);
 for(const name of ITEMS)await expect(page.locator(`[data-specimen-item="${name}"]`)).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'no horizontal scroll').toBe(false);
 expect(errors).toEqual([]);
});

test('a visitor without developer mode never sees it',async({page})=>{
 await page.goto('/#system',{waitUntil:'load'});
 await expect(page.locator('[data-system-specimen]')).toHaveCount(0);
 await expect(page.locator('.homepage-layout')).toBeVisible();
});

for(const name of ITEMS){
 test(`baseline: ${name}`,async({page})=>{
  await page.goto(SPECIMEN,{waitUntil:'load'});
  const item=page.locator(`[data-specimen-item="${name}"]`);
  await item.scrollIntoViewIfNeeded();
  // Images load as they near the viewport; wait for this item's own before measuring it.
  await expect.poll(()=>item.evaluate(element=>[...element.querySelectorAll('img')].every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  await item.evaluate(()=>document.fonts.ready);
  await expect(item).toHaveScreenshot(`${name.replace(':','-')}.png`,{animations:'disabled',maxDiffPixelRatio:SNAPSHOT_TOLERANCE,stylePath:HIDE_CHROME});
 });
}
