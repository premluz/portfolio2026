import {test,expect} from '@playwright/test';

// A still image never changes pixels on its own, so any darkening or lightening after the
// morph lands is an overlay left behind by the transition. It must stay flat in both directions.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
const MAX_DRIFT=3,OPEN_SETTLED_MS=1300,RETURN_SETTLED_MS=1000,WINDOW_MS=900;

async function brightnessSeries(page,box,milliseconds){
 const client=await page.context().newCDPSession(page),frames=[];
 client.on('Page.screencastFrame',async frame=>{frames.push(frame);await client.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{});});
 await client.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1,maxWidth:1440,maxHeight:900});
 return {stop:async()=>{await client.send('Page.stopScreencast');return page.evaluate(async({frames,box})=>{
  const out=[];for(const frame of frames){const image=new Image();image.src='data:image/jpeg;base64,'+frame.data;await image.decode();const canvas=document.createElement('canvas');canvas.width=box.w;canvas.height=box.h;const context=canvas.getContext('2d');context.drawImage(image,box.x,box.y,box.w,box.h,0,0,box.w,box.h);const data=context.getImageData(0,0,box.w,box.h).data;let sum=0;for(let i=0;i<data.length;i+=4)sum+=data[i]*.3+data[i+1]*.59+data[i+2]*.11;out.push({t:frame.metadata.timestamp*1000,value:sum/(data.length/4)});}return out;
 },{frames:frames.map(frame=>({data:frame.data,metadata:frame.metadata})),box});}};
}
const centre=rect=>({x:Math.round(rect.x+rect.width*.2),y:Math.round(rect.y+rect.height*.2),w:Math.round(rect.width*.6),h:Math.round(rect.height*.6)});
const drift=(series,from,to)=>{const part=series.filter(item=>item.t>=from&&item.t<=to).map(item=>item.value);return part.length?Math.max(...part)-Math.min(...part):0;};

test('a still project stays flat after the morph lands, both ways',async({page})=>{
 test.setTimeout(90000);
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 // Clips are hidden, so every project is a still image whose pixels cannot change on their own.
 await page.addStyleTag({content:'video{visibility:hidden!important}'});
 const card=page.locator(CENTRED),link=card.locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
 // A warm-up round trip tells us where the detail media sits, so both landings are measured where the media lands.
 await link.click();await expect(page).toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(OPEN_SETTLED_MS+500);
 const detailBox=centre(await page.locator('.detail .visual').boundingBox());
 await page.keyboard.press('Escape');await expect(page).not.toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(RETURN_SETTLED_MS+500);
 const cardBox=centre(await page.locator(CENTRED).locator('.visual').boundingBox());
 const opening=await brightnessSeries(page,detailBox,0);
 const clickedAt=Date.now();await link.click();await expect(page).toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(OPEN_SETTLED_MS+WINDOW_MS+200);
 const openSeries=await opening.stop();
 expect(drift(openSeries,clickedAt+OPEN_SETTLED_MS,clickedAt+OPEN_SETTLED_MS+WINDOW_MS),'detail media drifts after landing').toBeLessThan(MAX_DRIFT);
 const closing=await brightnessSeries(page,cardBox,0);
 const escapedAt=Date.now();await page.keyboard.press('Escape');await expect(page).not.toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(RETURN_SETTLED_MS+WINDOW_MS+200);
 const closeSeries=await closing.stop();
 expect(drift(closeSeries,escapedAt+RETURN_SETTLED_MS,escapedAt+RETURN_SETTLED_MS+WINDOW_MS),'carousel media drifts after the return lands').toBeLessThan(MAX_DRIFT);
});
