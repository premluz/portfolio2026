import {test,expect} from '@playwright/test';

test('gallery has no toolbar or structural bottom padding and margins',async({page})=>{
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#homeProductDisplay').evaluate(input=>{
  input.value='cards';input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await expect(page.locator('.gallery-toolbar')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Selected work & explorations',exact:true})).toHaveCount(1);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const layout of ['regular','masonry']){
   await page.locator('#homeLayoutSelect').evaluate((input,value)=>{
    input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));
   },layout);
   await expect(page.locator('.gallery-grid')).toBeVisible();
   const wrappers=page.locator('.home-work,.gallery-grid,.gallery-grid .card-slot,.gallery-grid .card-placement');
   for(const wrapper of await wrappers.all()){
    await expect(wrapper).toHaveCSS('margin-bottom','0px');
    await expect(wrapper).toHaveCSS('padding-bottom','0px');
   }
  }
 }
});
