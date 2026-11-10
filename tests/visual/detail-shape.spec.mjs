import {test,expect} from '@playwright/test';

// Ratios are within 1% of each other: the brief's tolerance for the card-to-page handoff.
const RATIO_TOLERANCE=0.01;
const NARROW_CAP_SHARE=0.7;
const shapes=[{id:'merlin',shape:'wide'},{id:'rios',shape:'tall'}];

const imageRatio=locator=>locator.evaluate(img=>{const box=img.getBoundingClientRect();return {box:box.width/box.height,natural:img.naturalWidth/img.naturalHeight};});

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('prem-detail-ratio-layout','true');localStorage.setItem('prem-detail-heading-beside','true');});
});

for(const {id,shape} of shapes){
 test(`${shape} project page keeps the card's image ratio and arranges by shape`,async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/#work',{waitUntil:'load'});
  const cardImage=page.locator(`[data-card="${id}"] .visual img`).first();
  await cardImage.scrollIntoViewIfNeeded();
  await expect(cardImage).toBeVisible();
  await expect.poll(()=>cardImage.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const start=await imageRatio(cardImage);
  expect(Math.abs(start.box/start.natural-1)).toBeLessThan(RATIO_TOLERANCE);

  // A fresh load, as a shared link gives. Changing only the hash on the loaded home page did not render the project page in this test.
  await page.goto('about:blank');
  await page.goto(`/#${id}`,{waitUntil:'load'});
  const detail=page.locator('.surface.detail');
  await expect(detail).toHaveAttribute('data-detail-shape',shape);
  const visual=detail.locator('.detail-media-column>.visual'),image=visual.locator('img').first();
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const end=await imageRatio(image);
  expect(Math.abs(end.box/start.box-1),'the page image ends on the ratio the card image started with').toBeLessThan(RATIO_TOLERANCE);
  const frame=await visual.boundingBox(),copy=await detail.locator('.description').boundingBox();
  expect(Math.abs(frame.width/frame.height/end.natural-1),'the frame itself has the hero ratio').toBeLessThan(RATIO_TOLERANCE);
  if(shape==='wide'){
   expect(copy.y,'copy sits below the media').toBeGreaterThanOrEqual(frame.y+frame.height);
   expect(frame.width,'media runs across the rail').toBeGreaterThan(copy.width);
  }else{
   expect(copy.x+copy.width,'copy is in its own column left of the media').toBeLessThanOrEqual(frame.x);
   await expect(detail.locator('.detail-media-column')).toHaveCSS('position','sticky');
   await page.evaluate(()=>scrollTo(0,150));
   const stuck=await visual.boundingBox();
   expect(stuck.y,'the sticky image stays in view while copy scrolls').toBeGreaterThanOrEqual(0);
   expect(stuck.y+stuck.height,'and fits the viewport').toBeLessThanOrEqual(900);
  }
 });
}

test('a tall hero is capped at 70svh and centred on narrow screens',async({page})=>{
 await page.setViewportSize({width:600,height:900});
 await page.goto('/#rios',{waitUntil:'load'});
 const detail=page.locator('.surface.detail');
 await expect(detail).toHaveAttribute('data-detail-shape','tall');
 const visual=detail.locator('.detail-media-column>.visual');
 await expect.poll(async()=>(await visual.boundingBox()).height).toBeLessThanOrEqual(900*NARROW_CAP_SHARE+1);
 const frame=await visual.boundingBox(),content=await detail.boundingBox();
 expect(frame.height).toBeGreaterThan(900*NARROW_CAP_SHARE-RATIO_TOLERANCE*900);
 expect(Math.abs(frame.x+frame.width/2-(content.x+content.width/2)),'centred in the page').toBeLessThan(2);
});
