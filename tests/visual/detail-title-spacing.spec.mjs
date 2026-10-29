import {test,expect} from '@playwright/test';

test('details title-to-company gap uses the carousel card rhythm',async({page})=>{
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const cardGap=await page.locator('.home-product-carousel .spatial-gallery-copy').first().evaluate(element=>parseFloat(getComputedStyle(element).rowGap));
 await page.goto('/?dev=1#tracr',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#cardCompanyYear').evaluate(input=>{
  input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.locator('#cardShowDescription').evaluate(input=>{
  input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const editorial of [false,true]){
   await page.locator('#editorialHeadings').evaluate((input,value)=>{
    input.checked=value;input.dispatchEvent(new Event('change',{bubbles:true}));
   },editorial);
   const spacing=await page.locator('.detail-caption').evaluate(element=>{
    const title=element.querySelector('.detail-caption-title'),lead=element.querySelector('.detail-caption-lead');
    return lead.getBoundingClientRect().top-title.getBoundingClientRect().bottom;
   });
   expect(spacing).toBeCloseTo(cardGap,1);
  }
 }
});
