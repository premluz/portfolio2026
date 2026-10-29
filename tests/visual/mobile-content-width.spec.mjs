import {test,expect} from '@playwright/test';

const cases=[
 ['work',['.home-about-copy p:not(:empty)','.home-approach-principles','.home-about-list>ul','.home-writing-list','.home-product-carousel .spatial-gallery-copy']],
 ['about',['.home-about-copy p:not(:empty)','.home-approach-principles','.home-about-list>ul','.home-writing-list']],
 ['tracr',['.detail-caption','.detail-layout>.description']],
 ['lab',['.lab-heading']],
 ['contact',['.info-detail>.info-body']]
];

for(const width of [375,600,768])for(const [route,selectors] of cases)test(`${route} content is full width at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/?dev=1#'+route,{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.evaluate(()=>{
  for(const input of document.querySelectorAll('[data-home-section-control],[data-about-section-control]')){
   input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 });
 if(route==='work')await page.evaluate(()=>{
  for(const [id,value] of [['homeProductDisplay','carousel'],['aboutGalleryVariant','perspective']]){
   const input=document.getElementById(id);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const input=document.getElementById('carouselDescriptionInCard');input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 for(const selector of selectors){
  const elements=page.locator('#main '+selector);expect(await elements.count(),selector).toBeGreaterThan(0);
  for(const element of await elements.all()){
   await expect(element).toBeVisible();
   const sizes=await element.evaluate(node=>{
    let parent=node.parentElement;
    while(getComputedStyle(parent).display==='contents')parent=parent.parentElement;
    const style=getComputedStyle(parent);
    return {own:node.getBoundingClientRect().width,available:parent.getBoundingClientRect().width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)};
   });
   expect(sizes.own,selector).toBeCloseTo(sizes.available,0);
  }
 }
});
