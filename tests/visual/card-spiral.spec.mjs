import {test,expect} from '@playwright/test';

// The experiment page: the spiral renders with WebGL, scrolling unwinds it into a grid, and a card
// opens its project from where it sits.
test('card spiral renders, unwinds into a grid and opens a project',async({page},info)=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto('/#about-lab');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const spiral=page.locator('[data-card-world="spiral"]');
 await expect(spiral).toHaveAttribute('data-card-world-state','ready',{timeout:15000});
 await page.waitForTimeout(1500);
 // The field is alive: the conveyor keeps moving with no input (guards against a stalled frame clock).
 const clip={x:200,y:150,width:1040,height:600},first=await page.screenshot({clip});await page.waitForTimeout(1000);
 expect(Buffer.compare(first,await page.screenshot({clip})),'the spiral drifts on its own').not.toBe(0);
 const top=await spiral.evaluate(node=>node.getBoundingClientRect().top+scrollY);
 const shots=[];
 for(const [name,fraction] of [['spiral',0],['speeding',.25],['grid',.6],['browse',.95]]){
  await page.evaluate(({top,fraction})=>{const node=document.querySelector('[data-card-world="spiral"]'),travel=node.offsetHeight-innerHeight;scrollTo({top:top+travel*fraction,behavior:'instant'});},{top,fraction});
  await page.waitForTimeout(900);
  const path=info.outputPath(name+'.png');await page.screenshot({path});shots.push(path);
 }
 // Click the middle of the screen in the grid: the card under it opens its project.
 await page.evaluate(({top})=>{const node=document.querySelector('[data-card-world="spiral"]'),travel=node.offsetHeight-innerHeight;scrollTo({top:top+travel*.7,behavior:'instant'});},{top});
 await page.waitForTimeout(900);
 const before=page.url();
 for(const [x,y] of [[720,450],[720,380],[460,450],[980,450]]){await page.mouse.click(x,y);await page.waitForTimeout(300);if(page.url()!==before)break;}
 expect(page.url(),'a grid card opens its project').not.toBe(before);
 await page.waitForTimeout(1200);
 expect(errors).toEqual([]);
});
