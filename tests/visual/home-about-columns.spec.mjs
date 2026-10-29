import {test,expect} from '@playwright/test';

const sections=['.home-about','.home-approach','[data-home-section="experience"]','[data-home-section="side-projects"]','.home-writing'];

test('homepage About sections keep headings and content in one half-width column',async({page})=>{
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.evaluate(()=>{
  for(const input of document.querySelectorAll('[data-home-section-control]')){
   input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 });
 for(const width of [1440,1920,390]){
  await page.setViewportSize({width,height:1000});
  for(const selector of sections){
   const section=page.locator('#main '+selector);await expect(section).toBeVisible();
   const box=await section.evaluate(element=>{
    const parent=element.parentElement,style=getComputedStyle(parent),rect=parent.getBoundingClientRect();
    const content=rect.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const own=element.getBoundingClientRect(),heading=element.querySelector('h2').getBoundingClientRect();
    const body=element.querySelector('.home-about-copy p,.home-approach-principles,ul').getBoundingClientRect();
    return {width:own.width,left:own.left,heading:heading.width,body:body.width,bodyLeft:body.left,start:rect.left+parseFloat(style.paddingLeft),content,gap:parseFloat(getComputedStyle(document.querySelector('.home-about-copy')).columnGap)};
   });
   expect(box.width).toBeCloseTo(width>1000?(box.content-box.gap)/2:box.content,0);
   expect(box.left).toBeCloseTo(box.start,0);expect(box.bodyLeft).toBeCloseTo(box.left,0);
   expect(box.heading).toBeLessThanOrEqual(box.width);expect(box.body).toBeCloseTo(box.width,0);
  }
 }
});
