import {test,expect} from '@playwright/test';

// A freshly started test server can still be preparing the page when the first spec loads it.
const BOOT_TIMEOUT=20000;
// Sub-pixel layout rounding between offset metrics and painted boxes.
const TOLERANCE=1;
const finish=page=>page.evaluate(async()=>{
 await new Promise(requestAnimationFrame);
 for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();
 await new Promise(requestAnimationFrame);
});
// Where the pill is painted, and which item's box it matches.
const pillOn=(page,group)=>page.locator(group).first().evaluate((element,tolerance)=>{
 const pill=element.querySelector(':scope>.selection-pill'),box=pill.getBoundingClientRect();
 const match=[...element.children].find(item=>item!==pill&&item.offsetWidth>0&&Math.abs(item.offsetLeft-pill.offsetLeft-parseFloat(getComputedStyle(pill).translate))<=tolerance&&Math.abs(item.offsetWidth-box.width)<=tolerance);
 return {shown:pill.dataset.shown,item:match?.textContent.trim()||match?.id||null};
},TOLERANCE);
const bareItems=(page,group)=>page.locator(group).first().evaluate(element=>[...element.querySelectorAll(':scope>.control-item')]
 .every(item=>{const style=getComputedStyle(item);return style.backgroundImage==='none'&&style.backgroundColor==='rgba(0, 0, 0, 0)';}));

async function open(page){
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:BOOT_TIMEOUT});
 await expect(page.locator('#dock')).toHaveClass(/control-container/);
 await page.mouse.move(0,0);await finish(page);
}

test('the menu highlight is one element that follows hover and returns to the current page',async({page})=>{
 const nav='#dock .dock-content>nav';
 await open(page);
 await expect(page.locator(nav+'>.selection-pill')).toHaveCount(1);
 expect(await pillOn(page,nav)).toEqual({shown:'true',item:'Work'});
 await page.locator(nav+' a[data-nav="contact"]').hover();await finish(page);
 expect(await pillOn(page,nav)).toEqual({shown:'true',item:'Contact'});
 expect(await bareItems(page,nav),'Items carry no highlight of their own, hovered or current').toBe(true);
 await page.mouse.move(0,0);await finish(page);
 expect(await pillOn(page,nav)).toEqual({shown:'true',item:'Work'});
 await page.locator(nav+' a[data-nav="about"]').click();await page.mouse.move(0,0);
 await expect(page.locator(nav+' a[data-nav="about"]')).toHaveClass(/active/);await finish(page);
 expect(await pillOn(page,nav)).toEqual({shown:'true',item:'About'});
});

test('the highlight glides between items instead of switching',async({page})=>{
 const nav='#dock .dock-content>nav';
 await open(page);
 // Site animation is a visitor setting that starts off in a fresh profile; the glide belongs to the animated mode.
 await page.evaluate(()=>{document.documentElement.dataset.animation='on';});
 const frame=()=>page.locator('#dock>.dock-glass').evaluate(element=>{const box=element.getBoundingClientRect();return [box.x,box.width];});
 const resting=await frame();
 await page.locator(nav+' a[data-nav="contact"]').hover();
 const moving=await page.locator(nav+'>.selection-pill').evaluate(async pill=>{
  await new Promise(requestAnimationFrame);
  return pill.getAnimations().filter(animation=>animation instanceof CSSTransition).map(animation=>animation.transitionProperty);
 });
 expect(moving).toContain('translate');
 // The menu itself must hold still while the pill travels and after it lands.
 for(const link of ['about','contact']){
  await page.locator(`${nav} a[data-nav="${link}"]`).hover();
  expect(await frame(),'mid-glide over '+link).toEqual(resting);
  await finish(page);await page.evaluate(()=>new Promise(requestAnimationFrame));
  expect(await frame(),'settled on '+link).toEqual(resting);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(0,0);
 const still=await page.locator(nav+'>.selection-pill').evaluate(async pill=>{await new Promise(requestAnimationFrame);return pill.getAnimations().length;});
 expect(still,'Reduced motion moves the highlight without animating it').toBe(0);
});

test('connected setting buttons share one highlight that returns to the selected option',async({page})=>{
 const group='#sitePreferencesMenu .theme-options';
 await open(page);
 await page.locator('#sitePreferencesToggle').click();await expect(page.locator('#sitePreferencesMenu')).toBeVisible();
 await page.mouse.move(0,0);await finish(page);
 const selected=await page.locator(group).first().locator('button.active').textContent();
 expect(await pillOn(page,group)).toEqual({shown:'true',item:selected.trim()});
 const other=page.locator(group).first().locator('button:not(.active)').first();
 await other.hover();await finish(page);
 expect(await pillOn(page,group)).toEqual({shown:'true',item:(await other.textContent()).trim()});
 expect(await bareItems(page,group)).toBe(true);
 await page.mouse.move(0,0);await finish(page);
 expect(await pillOn(page,group)).toEqual({shown:'true',item:selected.trim()});
});
