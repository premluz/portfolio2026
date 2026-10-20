import {test,expect} from '@playwright/test';
import {settingsRevision} from '../../dist/published-settings.js';

// Native snap experiment: the circular carousel is a real CSS snap scroller, so wheel, trackpad and touch
// coasting and the snap are the browser's own motion. Every interaction must still land centred on a card,
// and a page transition must bring the carousel back to the same card.
const GALLERY='[data-home-product-gallery] [data-card-gallery]';
const state=page=>page.evaluate(selector=>{
 const gallery=document.querySelector(selector),viewport=gallery.querySelector('[data-gallery-viewport]'),items=[...gallery.querySelectorAll('[data-gallery-item]')];
 const current=gallery.querySelector('[data-gallery-item][aria-current="true"]'),card=current.getBoundingClientRect(),box=viewport.getBoundingClientRect();
 return {index:items.indexOf(current),left:viewport.scrollLeft,loop:viewport.scrollWidth,offCentre:Math.abs(card.left+card.width/2-(box.left+box.width/2)),snap:getComputedStyle(viewport).scrollSnapType};
},GALLERY);
const settled=async page=>{let previous=null;for(let i=0;i<60;i++){const now=await state(page);if(previous&&now.left===previous.left&&now.index===previous.index)return now;previous=now;await page.waitForTimeout(100);}throw new Error('The carousel never settled');};

test('native snap scrolling lands on cards and survives a page transition',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(revision=>{localStorage.setItem('prem-site-settings-revision',revision);localStorage.setItem('prem-carousel-native-snap','true');},settingsRevision);
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const start=await settled(page);
 expect(start.snap).toBe('x mandatory');expect(start.offCentre).toBeLessThanOrEqual(1);

 const viewport=await page.locator(`${GALLERY} [data-gallery-viewport]`).boundingBox();
 await page.mouse.move(viewport.x+viewport.width/2,viewport.y+viewport.height/2);
 for(let i=0;i<8;i++){await page.mouse.wheel(120,0);await page.waitForTimeout(16);}
 const scrolled=await settled(page);
 expect(scrolled.index,'a wheel swipe moves to another card').not.toBe(start.index);
 expect(scrolled.offCentre,'and lands centred on it').toBeLessThanOrEqual(1);

 // The arrows only show on hover in this layout; their action is what matters here.
 await page.locator(`${GALLERY} [data-gallery-next]`).evaluate(button=>button.click());
 const next=await settled(page);
 expect(next.index).toBe((scrolled.index+1)%await page.locator(`${GALLERY} [data-gallery-item]`).count());expect(next.offCentre).toBeLessThanOrEqual(1);

 await page.mouse.move(viewport.x+viewport.width/2,viewport.y+viewport.height/2);await page.mouse.down();
 for(let step=1;step<=8;step++){await page.mouse.move(viewport.x+viewport.width/2-step*60,viewport.y+viewport.height/2);await page.waitForTimeout(16);}
 await page.mouse.up();
 const dragged=await settled(page);
 expect(dragged.index,'a mouse drag moves to another card').not.toBe(next.index);expect(dragged.offCentre).toBeLessThanOrEqual(1);

 const link=page.locator(`${GALLERY} [data-gallery-item][aria-current="true"] [data-content-card]`).first(),id=await link.getAttribute('data-content-card');
 await link.click();await expect(page).toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(1200);
 await page.keyboard.press('Escape');await expect(page).not.toHaveURL(new RegExp(`#${id}$`));
 const back=await settled(page);
 expect(back.index,'returning lands on the card that was opened').toBe(dragged.index);
 expect(back.offCentre).toBeLessThanOrEqual(1);
 // The scroller may come back a whole loop away (an identical picture); it must still agree with the ring.
 await page.locator(`${GALLERY} [data-gallery-next]`).evaluate(button=>button.click());
 const after=await settled(page);
 expect(after.index,'after returning, the scroller and the ring still agree').toBe((back.index+1)%await page.locator(`${GALLERY} [data-gallery-item]`).count());expect(after.offCentre).toBeLessThanOrEqual(1);
 expect(errors).toEqual([]);
});
