import {test,expect} from '@playwright/test';

const items=['Work','Lab','About','Contact','Assistant','Index'];
const toggle=(page,id,checked)=>page.locator('#'+id).evaluate((input,value)=>{
 input.checked=value;input.dispatchEvent(new Event('change',{bubbles:true}));
},checked);

for(const route of ['work','lab'])test(`empty navigation disappears on ${route} and returns with any item`,async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('prem-contextual-composer','false');
  localStorage.setItem('prem-character-assistant','false');
 });
 await page.goto('/?dev=1#'+route,{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 for(const item of items)await toggle(page,'navShow'+item,false);
 await expect(page.locator('#dock')).toBeHidden();
 for(const item of items){
  await toggle(page,'navShow'+item,true);
  await expect(page.locator('#dock')).toBeVisible();
  await toggle(page,'navShow'+item,false);
  await expect(page.locator('#dock')).toBeHidden();
 }
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await expect(page.locator('#dock')).toBeHidden();
 await page.locator('#contextualComposerPreference').evaluate(button=>button.click());
 await expect(page.locator('#dock')).toBeVisible();
 await expect(page.locator('#askInput')).toBeVisible();
});
