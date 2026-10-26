import {test,expect} from '@playwright/test';

async function loadSphere(page){
 await page.goto('/#about-sphere',{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-card-world="sphere"]')).toHaveAttribute('data-card-world-state','ready');
 await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.evaluate(async()=>{
  const {CardWorld}=await import('/card-world.js'),render=CardWorld.prototype.renderFrame;
  CardWorld.prototype.renderFrame=function(dt){window.sphereWorld=this;return render.call(this,dt);};
  document.querySelector('[data-card-world-stage]').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:0,clientY:0}));
 });
 await page.waitForFunction(()=>window.sphereWorld?.cards.every(card=>card.entry.ready));
}
async function pickCard(page){
 return page.evaluate(()=>{
  const world=window.sphereWorld,viewport=world.renderer.domElement.getBoundingClientRect();
  for(const card of world.cards){
   if(!card.mesh.visible||card.material.uniforms.uAlpha.value<.99||!card.item.projectId)continue;
   const point=card.mesh.position.clone().project(world.camera),x=viewport.left+(point.x+1)*viewport.width/2,y=viewport.top+(1-point.y)*viewport.height/2;
   if(y<180||y>innerHeight-160||world.pick(x,y)!==card)continue;
   window.sphereCard=card;return {x,y,id:card.item.projectId};
  }
  throw new Error('No visible project card is pickable');
 });
}
const positions=page=>page.evaluate(()=>window.sphereWorld.cards.map(card=>card.mesh.position.toArray()));
async function finishViewer(page){
 await page.evaluate(()=>Promise.all(document.querySelector('.sphere-viewer').getAnimations({subtree:true}).map(animation=>animation.finished)));
}

test('sphere rotates, freezes selection, returns exactly and links to the existing project',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await loadSphere(page);const stage=page.locator('[data-card-world-stage]');
 const before=await positions(page);
 await stage.focus();await page.keyboard.press('ArrowRight');expect(await positions(page)).not.toEqual(before);
 const point=await pickCard(page),start=await positions(page);
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+120,point.y+40,{steps:8});await page.mouse.up();
 await expect(page.locator('.sphere-viewer')).toHaveCount(0);expect(await positions(page)).not.toEqual(start);
 await stage.focus();await page.keyboard.press('ArrowRight');
 const selected=await pickCard(page);await page.mouse.click(selected.x,selected.y);
 await expect(page.locator('.sphere-viewer')).toBeVisible();await finishViewer(page);
 const held=await positions(page);expect(await page.evaluate(()=>window.sphereCard.mesh.visible)).toBe(false);
 await page.evaluate(()=>new Promise(resolve=>{let frames=12;function frame(){if(--frames)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);}));
 expect(await positions(page)).toEqual(held);
 await page.keyboard.press('Escape');await expect(page.locator('.sphere-viewer')).toHaveCount(0);
 await expect(page).toHaveURL(/#about-sphere$/);expect(await positions(page)).toEqual(held);
 expect(await page.evaluate(()=>window.sphereCard.mesh.visible)).toBe(true);
 const next=await pickCard(page);await page.mouse.click(next.x,next.y);await finishViewer(page);
 await page.getByRole('link',{name:'View project',exact:true}).click();await expect(page).toHaveURL(new RegExp(`#${next.id}$`));
 await expect(page.locator('.sphere-viewer')).toHaveCount(0);expect(errors).toEqual([]);
});

test('sphere baseline uses the existing card materials',async({page},info)=>{
 await loadSphere(page);
 const stage=page.locator('[data-card-world-stage]');
 expect(await page.evaluate(()=>window.sphereWorld.frame)).toBe(0);
 await expect(stage).toHaveScreenshot('sphere.png',{animations:'disabled',timeout:30000});
 await stage.screenshot({path:info.outputPath('sphere-review.png')});
});

test('mobile touch rotation, reduced motion and interrupted close',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await loadSphere(page);
 const stage=page.locator('[data-card-world-stage]'),before=await positions(page);
 const touch=await page.context().newCDPSession(page);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:400}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:250,y:450}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(await positions(page)).not.toEqual(before);
 await stage.focus();await page.keyboard.press('ArrowLeft');
 const selected=await pickCard(page);await page.mouse.click(selected.x,selected.y);await expect(page.locator('.sphere-viewer')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('.sphere-viewer')).toHaveCount(0);
 await expect(page).toHaveURL(/#about-sphere$/);
});

test('Escape during opening reverses without navigating away',async({page})=>{
 await loadSphere(page);const selected=await pickCard(page);await page.mouse.click(selected.x,selected.y);
 await expect(page.locator('.sphere-viewer')).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.locator('.sphere-viewer')).toHaveCount(0);await expect(page).toHaveURL(/#about-sphere$/);
 expect(await page.evaluate(()=>window.sphereCard.mesh.visible)).toBe(true);
});
