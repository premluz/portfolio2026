import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';

// Real frames of the dock area while the menu opens and closes and while composer pills
// ("View project", footer actions) grow and recede on scroll. scripts/check-flash-frames.py then
// fails on any single-frame flash; the outline must also be traced (liquid) while pieces move.
const PRESET=process.env.DOCK_PRESET?JSON.parse((await import('node:fs')).readFileSync(process.env.DOCK_PRESET,'utf8')):null;
test.use({deviceScaleFactor:Number(process.env.DOCK_SCALE)||1});
test('dock morphs without flashes',async({page},info)=>{
 test.setTimeout(120000);
 // DOCK_PRESET points at a localStorage map (e.g. an exported dev preset) to replay someone's settings.
 if(PRESET)await page.addInitScript(values=>{for(const [key,value] of Object.entries(values))localStorage.setItem(key,value);},PRESET);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const dock=await page.locator('#dock').boundingBox(),dir=info.outputPath('frames');await mkdir(dir,{recursive:true});
 const client=await page.context().newCDPSession(page),frames=[];
 client.on('Page.screencastFrame',async frame=>{frames.push(frame);await client.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{});});
 await client.send('Page.startScreencast',{format:'png',everyNthFrame:1,maxWidth:1440,maxHeight:900});
 // Lobes per frame: a pill that has detached must not fuse back for a moment and detach again.
 await page.evaluate(()=>{window.__lobes=[];const tick=()=>{const d=document.querySelector('#dock > svg.dock-outline > path')?.getAttribute('d')||'';window.__lobes.push((d.match(/M /g)||[]).length);if(!window.__stopLobes)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
 await page.evaluate(()=>document.body.focus());await page.keyboard.press('/');await page.waitForTimeout(1100);
 await page.keyboard.press('Escape');await page.waitForTimeout(1100);
 for(const y of [700,1600,2600,4200,99999,0]){await page.evaluate(top=>scrollTo({top,behavior:'instant'}),y);await page.waitForTimeout(1300);}
 await client.send('Page.stopScreencast');
 const lobes=await page.evaluate(()=>{window.__stopLobes=true;return window.__lobes;});
 const flickers=[];for(let i=1;i<lobes.length;i++)if(lobes[i]<lobes[i-1]){const back=lobes.slice(i+1,i+9).findIndex(value=>value>=lobes[i-1]);if(back>=0)flickers.push({frame:i,from:lobes[i-1],to:lobes[i],backAfter:back+1});}
 await writeFile(info.outputPath('lobes.json'),JSON.stringify({lobes,flickers}));
 expect(flickers,'detached glass fused back for a moment, then detached again').toEqual([]);
 let index=0;for(const frame of frames){await writeFile(`${dir}/${String(index++).padStart(4,'0')}-${frame.metadata.timestamp.toFixed(3)}.png`,Buffer.from(frame.data,'base64'));}
 await writeFile(info.outputPath('dock.json'),JSON.stringify(dock));
 expect(errors).toEqual([]);
});
