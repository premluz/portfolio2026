import {test,expect} from '@playwright/test';

// A canvas copy of a clip renders its dark tones darker than the <video> itself, so a bridge drawn over
// the landing media reads as a tone flash on settling. Where moveBefore keeps the clip painting through
// the move, no bridge may appear at all, in either direction.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';

test('a carried clip lands without a canvas stand-in, both ways',async({page})=>{
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 test.skip(!await page.evaluate(()=>typeof Element.prototype.moveBefore==='function'),'This browser has no moveBefore, so the bridge is its fallback');
 const card=page.locator(CENTRED);
 await expect(card.locator('.visual.video-preview-playing')).toBeVisible({timeout:15000});
 await page.evaluate(()=>{window.__bridges=0;new MutationObserver(list=>{for(const m of list)for(const node of m.addedNodes)if(node.classList?.contains('video-frame-bridge'))window.__bridges++;}).observe(document.body,{subtree:true,childList:true});});
 const link=card.locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
 await link.click();await expect(page).toHaveURL(new RegExp(`#${id}$`));
 await expect(page.locator('.detail .visual.video-preview-playing')).toBeVisible({timeout:15000});
 await page.keyboard.press('Escape');await expect(page).not.toHaveURL(new RegExp(`#${id}$`));
 await expect(page.locator(CENTRED).locator('.visual.video-preview-playing')).toBeVisible({timeout:15000});
 expect(await page.evaluate(()=>window.__bridges),'bridge canvases drawn during open and return').toBe(0);
});
