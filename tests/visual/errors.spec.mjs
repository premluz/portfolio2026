import {test,expect} from '@playwright/test';

// Opening a project from the carousel and going back must never raise an error or the failure toast.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
const PROJECTS=8;

test('open and return from the carousel raises no errors for any project',async({page})=>{
 test.setTimeout(240000);
 const errors=[];
 page.on('pageerror',error=>errors.push('pageerror: '+error.message+'\n'+(error.stack||'').split('\n').slice(0,4).join('\n')));
 page.on('console',async message=>{if(message.type()!=='error')return;const stack=await message.args()[1]?.evaluate(error=>error?.stack).catch(()=>'')||'';errors.push('console: '+message.text()+'\n'+stack.split('\n').slice(0,6).join('\n'));});
 await page.goto('/');
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 for(let index=0;index<PROJECTS;index++){
  const card=page.locator(CENTRED);await card.scrollIntoViewIfNeeded();
  const id=await card.locator('[data-content-card]').first().getAttribute('data-content-card');
  await page.waitForTimeout(900);
  for(const way of ['escape','back']){
   const link=page.locator(CENTRED).locator('[data-content-card]').first();await link.click();await expect(page,'opening '+id+' after '+way+'; errors so far: '+errors.join(' | ')).toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(1300);
   if(way==='escape')await page.keyboard.press('Escape');else await page.locator('#back,[data-back],.assistant-back').first().click({timeout:2000}).catch(()=>page.keyboard.press('Escape'));
   await expect(page).not.toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(900);
   expect(await page.getByText('Could not complete that action').count(),`failure toast after ${way} on ${id}; errors: ${errors.join(' | ')}`).toBe(0);
  }
  await page.evaluate(()=>document.querySelector('[data-home-product-gallery] [data-gallery-next]').click());await page.waitForTimeout(700);
 }
 expect(errors,errors.join('\n---\n')).toEqual([]);
});
