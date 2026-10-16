import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {startFrameSampler,stillImageFrames,jumpFrames,restartFrames} from './frame-sampler.mjs';

const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
const PROJECTS=4,REPEATS=2;

async function record(page,action,settled){
 await page.evaluate(`(${startFrameSampler.toString()})()`);
 await action();
 await settled();
 await page.waitForTimeout(1200);
 return page.evaluate(()=>{window.__stopFrames=true;return window.__frames;});
}

async function openAndReturn(page,{hover}){
 const card=page.locator(CENTRED);
 await card.scrollIntoViewIfNeeded();
 if(hover)await card.hover();
 await expect(card.locator('.visual.video-preview-playing')).toBeVisible({timeout:15000});
 const link=card.locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
 const url=await card.locator('video[data-video-url]').first().getAttribute('data-video-url');
 const opening=await record(page,()=>link.click(),()=>expect(page).toHaveURL(new RegExp(`#${id}$`)));
 await expect(page.locator('.detail .visual.video-preview-playing')).toBeVisible({timeout:15000});
 const closing=await record(page,()=>page.keyboard.press('Escape'),()=>expect(page).not.toHaveURL(new RegExp(`#${id}$`)));
 return {id,url,opening,closing};
}

test('a playing carousel clip stays video, in place, through open and return',async({page},info)=>{
 test.setTimeout(240000);
 await page.goto('/');
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const runs=[];
 for(let project=0;project<PROJECTS;project++){
  for(let repeat=0;repeat<REPEATS;repeat++)runs.push(await openAndReturn(page,{hover:repeat===0}));
  // The Next control is visually hidden in this layout; its handler is what the arrow keys use too.
  await page.evaluate(()=>document.querySelector('[data-home-product-gallery] [data-gallery-next]').click());
  await page.waitForTimeout(700);
 }
 const report=runs.map(run=>({id:run.id,flashes:{opening:stillImageFrames(run.opening,run.url),closing:stillImageFrames(run.closing,run.url)},jumps:{opening:jumpFrames(run.opening),closing:jumpFrames(run.closing)}}));
 await mkdir(info.outputDir,{recursive:true});
 await writeFile(info.outputPath('frames.json'),JSON.stringify(runs,null,1));
 await writeFile(info.outputPath('flashes.json'),JSON.stringify(report,null,1));
 const restarts=runs.map(run=>({id:run.id,opening:restartFrames(run.opening,run.url),closing:restartFrames(run.closing,run.url)}));
 await writeFile(info.outputPath('restarts.json'),JSON.stringify(restarts,null,1));
 expect.soft(restarts.reduce((sum,run)=>sum+run.opening.length+run.closing.length,0),'times the playing clip restarted from the beginning (its dark intro replays)').toBe(0);
 const count=key=>report.reduce((sum,run)=>sum+run[key].opening.length+run[key].closing.length,0);
 expect.soft(count('flashes'),'frames where the playing clip is not what is on screen').toBe(0);
 expect.soft(count('jumps'),'frames where the moving clip jumps position').toBe(0);
});
