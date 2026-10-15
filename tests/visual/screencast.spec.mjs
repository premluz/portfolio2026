import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';

// Real composited frames (not DOM state) across carousel → detail → Escape; scripts/check-flash-frames.py scans them.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
test('screencast of the carousel open and return',async({page},info)=>{
 test.setTimeout(120000);
 await page.goto('/');
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const card=page.locator(CENTRED);await card.scrollIntoViewIfNeeded();
 await expect(card.locator('.visual.video-preview-playing')).toBeVisible({timeout:15000});
 const link=card.locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
 const dir=info.outputPath('frames');await mkdir(dir,{recursive:true});
 const client=await page.context().newCDPSession(page),frames=[];
 client.on('Page.screencastFrame',async frame=>{frames.push({t:frame.metadata.timestamp,data:frame.data});await client.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{});});
 await client.send('Page.startScreencast',{format:'png',everyNthFrame:1,maxWidth:1440,maxHeight:900});
 await page.waitForTimeout(300);
 const marks={};marks.click=Date.now()/1000;
 await link.click();await expect(page).toHaveURL(new RegExp(`#${id}$`));
 await page.waitForTimeout(1500);marks.escape=Date.now()/1000;
 await page.keyboard.press('Escape');
 await page.waitForTimeout(1500);
 await client.send('Page.stopScreencast');
 let index=0;for(const frame of frames)await writeFile(`${dir}/${String(index++).padStart(3,'0')}-${frame.t.toFixed(3)}.png`,Buffer.from(frame.data,'base64'));
 await writeFile(info.outputPath('marks.json'),JSON.stringify(marks));
});
