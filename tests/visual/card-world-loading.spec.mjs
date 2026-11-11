import {test,expect} from '@playwright/test';

// The small loader ships with the app; the world code and three.js do not.
const THREE=/three\.module\.js|\/card-world(-mount)?\.js|\/card-spiral\.js|\/card-sphere\.js/;

test('the home page never downloads three.js or the card worlds',async({page})=>{
 const seen=[];
 page.on('request',request=>{if(THREE.test(request.url()))seen.push(request.url());});
 await page.goto('/#work',{waitUntil:'load'});
 await expect(page.locator('.gallery-grid .image-card').first()).toBeVisible();
 expect(seen).toEqual([]);
});

test('a direct visit to a card world loads its code and draws it',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const loaded=page.waitForRequest(request=>/three\.module\.js/.test(request.url()));
 await page.goto('/#about-sphere',{waitUntil:'load'});
 await loaded;
 await expect(page.locator('[data-card-world-stage] canvas').first()).toBeVisible();
 expect(errors).toEqual([]);
});

test('navigating in the app to a card world waits for its code, then shows it',async({page})=>{
 await page.goto('/#work',{waitUntil:'load'});
 await expect(page.locator('.gallery-grid .image-card').first()).toBeVisible();
 await page.evaluate(()=>{location.hash='about-sphere';});
 await expect(page.locator('[data-card-world-stage] canvas').first()).toBeVisible();
});

test('a failed card world download keeps the current page and says so',async({page})=>{
 await page.route('**/card-world-mount.js',route=>route.abort());
 await page.goto('/#work',{waitUntil:'load'});
 await expect(page.locator('.gallery-grid .image-card').first()).toBeVisible();
 await page.evaluate(()=>{location.hash='about-sphere';});
 await expect(page.locator('#interactionFeedback')).toContainText('card view could not load');
 await expect(page.locator('.gallery-grid .image-card').first()).toBeVisible();
 expect(await page.evaluate(()=>location.hash)).toBe('#work');
 await expect(page.locator('[data-card-world]')).toHaveCount(0);
});
