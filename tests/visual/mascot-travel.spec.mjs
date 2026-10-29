import {test,expect} from '@playwright/test';

// Read the values actually sent to the halo shader, rather than inferring motion from DOM position alone.
function installGpuProbe(){
 const names=new WeakMap(),prototype=WebGL2RenderingContext.prototype;
 const location=prototype.getUniformLocation,vector=prototype.uniform2f,matrix=prototype.uniformMatrix4fv;
 window.mascotGPU={trail:[0,0],deformation:1};
 prototype.getUniformLocation=function(program,name){
  const result=location.call(this,program,name);if(result)names.set(result,name);return result;
 };
 prototype.uniform2f=function(address,x,y){
  if(names.get(address)==='trail'&&this.canvas.closest('.agent'))window.mascotGPU.trail=[x,y];
  return vector.call(this,address,x,y);
 };
 prototype.uniformMatrix4fv=function(address,transpose,value,...rest){
  if(names.get(address)==='bodyInverse'&&this.canvas.closest('.agent')){
   const axes=[Math.hypot(value[0],value[1],value[2]),Math.hypot(value[4],value[5],value[6]),Math.hypot(value[8],value[9],value[10])];
   window.mascotGPU.deformation=Math.max(...axes)/Math.min(...axes);
  }
  return matrix.call(this,address,transpose,value,...rest);
 };
}

async function openMascot(page,reduced){
 await page.addInitScript(installGpuProbe);
 await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
 await page.goto('/?dev=1',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await page.evaluate(()=>{
  for(const id of ['showMascot','characterAssistant','navShowWork']){
   const input=document.getElementById(id);input.checked=true;input.dispatchEvent(new Event('change'));
  }
  const position=document.getElementById('navPosition');position.value='bottom';position.dispatchEvent(new Event('change'));
 });
 await expect(page.locator('.agent')).toHaveAttribute('data-state','home',{timeout:15000});
 await expect(page.locator('.agent')).toHaveAttribute('data-renderer','webgl');
}

// The move, GPU sampling and settling all share the page's frame clock; MCP/runner latency cannot affect evidence.
async function travel(page,delta){
 return page.evaluate(async({x,y})=>{
  const root=document.querySelector('.agent'),shell=root.querySelector('.agent-shell');
  await Promise.all(shell.getAnimations().map(animation=>animation.finished));
  await new Promise((resolve,reject)=>{
   let start,quietSince;
   const settle=now=>{
    start??=now;const elapsed=now-start;
    const quiet=Math.hypot(...window.mascotGPU.trail)<0.25&&window.mascotGPU.deformation<1.04;
    if(!quiet)quietSince=undefined;else quietSince??=now;
    if(quietSince!==undefined&&now-quietSince>300)return resolve();
    if(elapsed>10000)return reject(new Error(`Mascot did not settle: ${JSON.stringify({gpu:window.mascotGPU,state:root.dataset.state,hidden:document.hidden,box:root.getBoundingClientRect().toJSON()})}`));
    requestAnimationFrame(settle);
   };
   requestAnimationFrame(settle);
  });
  const box=root.getBoundingClientRect(),origin={x:box.left+box.width/2,y:box.top+box.height/2};
  const dx=origin.x+x<box.width/2||origin.x+x>innerWidth-box.width/2?-x:x;
  const dy=origin.y+y<box.height/2||origin.y+y>innerHeight-box.height/2?-y:y;
  if(origin.x+dx<0||origin.x+dx>innerWidth||origin.y+dy<0||origin.y+dy>innerHeight)throw new Error(`Travel must remain on screen: ${JSON.stringify({origin,dx,dy})}`);
  const samples=[];let start;
  await new Promise(resolve=>{
   const frame=now=>{
    start??=now;const elapsed=now-start,progress=Math.min(1,elapsed/700);
    root.style.setProperty('--agent-x',`${origin.x+dx*progress}px`);
    root.style.setProperty('--agent-y',`${origin.y+dy*progress}px`);
    samples.push({elapsed,trail:Math.hypot(...window.mascotGPU.trail),deformation:window.mascotGPU.deformation});
    if(elapsed<3700)requestAnimationFrame(frame);else resolve();
   };
   requestAnimationFrame(frame);
  });
  return samples;
 },delta);
}

for(const direction of [{name:'horizontal',x:-180,y:0},{name:'diagonal',x:80,y:-150}]){
 test(`folio ${direction.name} travel smears the glow, deforms and settles`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await openMascot(page,false);
  const samples=await travel(page,direction),moving=samples.filter(sample=>sample.elapsed<1000),rest=samples.at(-1);
  expect(Math.max(...moving.map(sample=>sample.trail))).toBeGreaterThan(10);
  expect(Math.max(...moving.map(sample=>sample.deformation))).toBeGreaterThan(1.08);
  expect(rest.trail).toBeLessThan(1);
  expect(rest.deformation).toBeLessThan(1.04);
  expect(errors).toEqual([]);
 });
}

for(const mode of ['reduced motion','animation off'])test(`${mode} keeps glow attached and body undeformed during container travel`,async({page})=>{
 await openMascot(page,mode==='reduced motion');
 if(mode==='animation off')await page.evaluate(()=>{document.documentElement.dataset.animation='off';});
 const samples=await travel(page,{x:-180,y:-100});
 // TRAIL.restDistance is 0.25 stage units: the drag engine sleeps with that subpixel remainder.
 expect(Math.max(...samples.map(sample=>sample.trail))).toBeLessThan(mode==='animation off'?0.25:0.01);
 expect(Math.max(...samples.map(sample=>sample.deformation))).toBeLessThan(1.01);
});
