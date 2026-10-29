import {test,expect} from '@playwright/test';

const variants=['ghost','outline','glass'];
const change=(page,id,value)=>page.locator('#'+id).evaluate((input,next)=>{
 input.value=next;input.dispatchEvent(new Event('change',{bubbles:true}));
},value);
const settle=page=>page.evaluate(async()=>{
 await new Promise(requestAnimationFrame);
 for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();
 await new Promise(requestAnimationFrame);
});
const material=locator=>locator.evaluate(element=>{
 const style=getComputedStyle(element);
 return {fill:style.backgroundColor,image:style.backgroundImage,border:style.borderTopColor,shadow:style.boxShadow,filter:style.backdropFilter};
});
async function ready(page,route='tracr'){
 await page.goto('/?dev=1#'+route,{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await expect(page.locator('#dock')).toHaveClass(/control-container/);
}
async function verifyVariant(page,variant,theme){
 await change(page,'controlStyle',variant);
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.querySelector('#dock').classList.remove('always-dark-glass');},theme);
 await page.mouse.move(0,0);await settle(page);
 const reference=await material(page.locator('[data-header-action="back"]'));
 await expect(page.locator('#projectMenuToggle')).toHaveClass(new RegExp('control-'+variant));
 await expect(page.locator('#projectMenuToggle')).toHaveClass(/control-item/);
 for(const selector of ['[data-header-action="previous"]','.detail-media-actions button']){
  await expect(page.locator(selector).first()).toHaveClass(new RegExp('control-'+variant));
  expect(await material(page.locator(selector).first())).toEqual(reference);
 }
 if(variant==='ghost'){
  expect(reference.fill).toBe('rgba(0, 0, 0, 0)');expect(reference.image).toBe('none');
  expect(reference.border).toBe('rgba(0, 0, 0, 0)');expect(reference.shadow).toBe('none');expect(reference.filter).toBe('none');
 }else if(variant==='outline')expect(reference.border).not.toBe('rgba(0, 0, 0, 0)');
 else{expect(reference.border).toBe('rgba(0, 0, 0, 0)');expect(reference.shadow).not.toBe('none');}
 expect(await page.locator('#dock>.dock-glass').evaluate(element=>getComputedStyle(element).backgroundImage)).toBe(reference.image);
}

test('three global variants share material across themes and viewport sizes',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await ready(page);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const theme of ['dark','light'])for(const variant of variants)await verifyVariant(page,variant,theme);
 }
 expect(errors).toEqual([]);
});

test('group and element overrides win, persist, and cover dynamically rendered controls',async({page})=>{
 await ready(page);
 await change(page,'controlStyle','ghost');
 await change(page,'controlStyleProjects','outline');
 await change(page,'controlStyleCarousels','glass');
 await change(page,'controlStyleSuggestions','outline');
 await expect(page.locator('[data-header-action="back"]')).toHaveClass(/control-outline/);
 await expect(page.locator('#dock')).toHaveClass(/control-ghost/);
 await change(page,'controlStyleNavigation','glass');
 await change(page,'controlStyleUtilities','outline');
 await expect(page.locator('#dock')).toHaveClass(/control-glass/);
 await expect(page.locator('#settingsToggle')).toHaveClass(/control-outline/);
 await page.locator('.header-detail-nav').evaluate(element=>element.dataset.controlStyle='ghost');
 await expect(page.locator('[data-header-action="back"]')).toHaveClass(/control-ghost/);
 await page.locator('[data-header-action="back"]').evaluate(element=>element.dataset.controlStyle='glass');
 await expect(page.locator('[data-header-action="back"]')).toHaveClass(/control-glass/);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-header-action="back"]')).toHaveClass(/control-outline/);
 await expect(page.locator('#dock')).toHaveClass(/control-glass/);
 await page.goto('/?dev=1#work',{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-home-product-gallery] [data-gallery-next]')).toHaveClass(/control-glass/);
 await page.goto('/?dev=1#assistant',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.ask-suggestions button').first()).toHaveClass(/control-outline/);
 await page.evaluate(async()=>{
  const {renderSuggestionChips}=await import('/suggestion-chips.js');
  const panel=document.createElement('div');panel.className='composer-suggestions';document.querySelector('#dock').append(panel);
  renderSuggestionChips(panel,['Dynamically created suggestion']);
 });
 await expect(page.locator('.composer-suggestions button')).toHaveClass(/control-outline/);
 await change(page,'controlStyleProjects','inherit');
 expect(await page.evaluate(()=>localStorage.getItem('prem-control-style-projects'))).toBe('inherit');
});

test('ghost controls keep hover, focus, press, reduced motion and centred fullscreen Close',async({page})=>{
 await ready(page);await change(page,'controlStyle','ghost');
 await page.evaluate(()=>{document.documentElement.dataset.animation='on';document.documentElement.dataset.contextualPlacement='below';document.documentElement.dataset.navPosition='top';});
 const button=page.locator('[data-header-action="previous"]');
 const scales=await page.evaluate(()=>{const style=getComputedStyle(document.documentElement);return{hover:style.getPropertyValue('--card-hover-scale').trim(),press:style.getPropertyValue('--glass-button-press-scale').trim()};});
 await button.hover();await expect(button).toHaveCSS('scale',Number(scales.hover).toString());
 expect((await material(button)).image!=='none'||(await material(button)).fill!=='rgba(0, 0, 0, 0)').toBe(true);
 await page.mouse.down();await expect(button).toHaveCSS('scale',Number(scales.press).toString());
 await page.mouse.move(0,0);await page.mouse.up();
 await page.keyboard.press('Tab');await button.focus();await expect(button).toHaveCSS('outline-style','solid');
 await page.emulateMedia({reducedMotion:'reduce'});await button.hover();await expect(button).toHaveCSS('scale','1');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>document.documentElement.dataset.animation='off');await expect(button).toHaveCSS('scale','1');
 await page.evaluate(()=>document.documentElement.dataset.animation='on');
 const full=page.locator('[data-media-focus="fullscreen"]');await full.evaluate(element=>element.hidden=false);await full.click();
 const close=page.locator('.project-media-focus-close.is-floating');await expect(close).toHaveClass(/control-ghost/);
 await close.hover();await settle(page);
 const hovered=await close.boundingBox();expect(Math.abs(hovered.x+hovered.width/2-page.viewportSize().width/2)).toBeLessThan(1);
 await page.mouse.down();await settle(page);
 const pressed=await close.boundingBox();expect(Math.abs(pressed.x+pressed.width/2-page.viewportSize().width/2)).toBeLessThan(1);
 await page.mouse.up();await expect(close).toHaveCount(0);
});

test('new settings UI keeps card glass independent of control style',async({page})=>{
 await ready(page);
 await page.locator('#settingsToggle').click();await page.locator('#settingsTabDesign').click();
 await page.locator('#settingsPanelDesign > details > summary').filter({hasText:/^Controls$/}).click();
 await page.locator('#controlStyle').selectOption('outline');
 await expect(page.locator('[data-header-action="back"]')).toHaveClass(/control-outline/);
 await expect(page.locator('#plainNav,#glassStyle')).toHaveCount(0);
 await settle(page);
 const before=await material(page.locator('[data-header-action="back"]'));
 await page.locator('#cardGlassStyle').evaluate(input=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));});
 await expect(page.locator('html')).toHaveAttribute('data-card-glass-style','off');
 await settle(page);
 expect(await material(page.locator('[data-header-action="back"]'))).toEqual(before);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).toHaveAttribute('data-card-glass-style','off');
 await expect(page.locator('[data-header-action="back"]')).toHaveClass(/control-outline/);
});

test('footer labels and icons inherit the shared control variants and Utilities override',async({page})=>{
 await ready(page,'work');
 await page.evaluate(()=>{
  for(const id of ['showFooterContactLinks','footerLinksAsText']){
   const input=document.getElementById(id);input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 });
 const contacts=page.locator('.footer-links').locator('a,button');await expect(contacts).toHaveCount(2);
 await expect(page.locator('.footer-link-label')).toHaveText(['LinkedIn','Email']);
 for(const variant of variants){
  await change(page,'controlStyle',variant);await page.mouse.move(0,0);await settle(page);
  const reference=await material(page.locator('[data-header-action="back"]'));
  for(const contact of await contacts.all()){
   await expect(contact).toHaveClass(new RegExp('control-'+variant));expect(await material(contact)).toEqual(reference);
   expect(await contact.evaluate(element=>getComputedStyle(element).paddingInlineStart)).not.toBe('0px');
   await expect(contact).toHaveCSS('text-decoration-line','none');
   expect(await contact.evaluate(element=>{
    const style=getComputedStyle(element),radius=parseFloat(style.borderTopLeftRadius);
    return radius>=element.offsetHeight/2&&style.borderTopLeftRadius===style.borderTopRightRadius;
   })).toBe(true);
  }
  await contacts.first().hover();await settle(page);expect(await material(contacts.first())).not.toEqual(reference);
 }
 const press=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--glass-button-press-scale')).toString());
 await page.mouse.down();await expect(contacts.first()).toHaveCSS('scale',press);await page.mouse.move(0,0);await page.mouse.up();
 await change(page,'controlStyleUtilities','outline');await expect(contacts.first()).toHaveClass(/control-outline/);
 await page.locator('#footerLinksAsText').evaluate(input=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));});
 await expect(page.locator('.footer-link-label').first()).toBeHidden();await expect(contacts.first()).toHaveClass(/control-outline/);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('.footer-links a')).toHaveClass(/control-outline/);
});
