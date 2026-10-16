import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';

// Records the dock while the site menu grows out of it and folds back, and while the dock splits for a
// project and merges home. Frames go to test-results for review; the run fails on any page error.
test('dock liquid morph frames',async({page},info)=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const dir=info.outputPath('frames');await mkdir(dir,{recursive:true});
 const client=await page.context().newCDPSession(page),frames=[];
 client.on('Page.screencastFrame',async frame=>{frames.push(frame);await client.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{});});
 await client.send('Page.startScreencast',{format:'png',everyNthFrame:1,maxWidth:1440,maxHeight:900});
 const marks={};const mark=name=>{marks[name]=Date.now()/1000;};
 mark('menu-open');await page.evaluate(()=>document.body.focus());await page.keyboard.press('/');await page.waitForTimeout(900);
 mark('menu-close');await page.keyboard.press('Escape');await page.waitForTimeout(900);
 const link=page.locator('[data-home-product-gallery] [data-gallery-item][aria-current="true"] [data-content-card]').first();
 mark('split');await link.click();await page.waitForTimeout(1500);
 mark('merge');await page.keyboard.press('Escape');await page.waitForTimeout(1500);
 await client.send('Page.stopScreencast');
 let index=0;for(const frame of frames)await writeFile(`${dir}/${String(index++).padStart(3,'0')}-${frame.metadata.timestamp.toFixed(3)}.png`,Buffer.from(frame.data,'base64'));
 const dock=await page.locator('#dock').boundingBox();
 await writeFile(info.outputPath('meta.json'),JSON.stringify({marks,dock}));
 expect(errors).toEqual([]);
});
