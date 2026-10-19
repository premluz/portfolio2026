import {test,expect} from '@playwright/test';

// The infinite card space renders, responds to drag and wheel, and a click opens a project card.
test('infinite card space flies and opens a project',async({page},info)=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto('/#about-infinite');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const world=page.locator('[data-card-world="infinite"]');
 await expect(world).toHaveAttribute('data-card-world-state','ready',{timeout:15000});
 await world.scrollIntoViewIfNeeded();await page.waitForTimeout(2000);
 const stage=await world.locator('[data-card-world-stage]').boundingBox(),clip={x:stage.x+100,y:stage.y+80,width:stage.width-200,height:stage.height-200};
 await page.screenshot({path:info.outputPath('start.png')});
 // Click a visible project card first, while the field is settled: it opens the project.
 const startUrl=page.url();
 outer:for(let gy=.3;gy<=.7;gy+=.1)for(let gx=.3;gx<=.7;gx+=.1){await page.mouse.click(stage.x+stage.width*gx,stage.y+stage.height*gy);await page.waitForTimeout(250);if(page.url()!==startUrl)break outer;}
 expect(page.url(),'a project card opens').not.toBe(startUrl);
 await page.goBack();await expect(world).toHaveAttribute('data-card-world-state','ready',{timeout:15000});await world.scrollIntoViewIfNeeded();await page.waitForTimeout(1500);

 const before=await page.screenshot({clip});
 // Drag: the field moves with inertia.
 await page.mouse.move(stage.x+stage.width/2,stage.y+stage.height/2);await page.mouse.down();
 for(let i=1;i<=10;i++)await page.mouse.move(stage.x+stage.width/2-i*30,stage.y+stage.height/2-i*10);
 await page.mouse.up();await page.waitForTimeout(800);
 const dragged=await page.screenshot({clip});expect(Buffer.compare(before,dragged),'drag moves the view').not.toBe(0);
 await page.screenshot({path:info.outputPath('dragged.png')});
 // Wheel: fly forward into the space.
 for(let i=0;i<8;i++){await page.mouse.wheel(0,-120);await page.waitForTimeout(40);}
 await page.waitForTimeout(900);await page.screenshot({path:info.outputPath('flown.png')});
 expect(Buffer.compare(dragged,await page.screenshot({clip})),'scrolling flies through the space').not.toBe(0);
 await page.waitForTimeout(1000);
 expect(errors).toEqual([]);
});
