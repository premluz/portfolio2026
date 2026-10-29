import {test,expect} from '@playwright/test';

const inputs={material:'mascotMaterial',palette:'mascotPalette',glow:'mascotGlow',glowTint:'mascotGlowTint',motion:'mascotMotion',variety:'mascotVariety'};
const pose=page=>page.locator('.agent canvas').evaluate(canvas=>JSON.parse(canvas.dataset.pose));
async function boot(page){
 await page.goto('/?dev=1',{waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await expect(page.locator('.agent')).toHaveAttribute('data-renderer','webgl',{timeout:15000});
}
async function controls(page){
 await page.locator('#settingsToggle').click();
 await page.locator('#settingsTabMascott').click();
 await page.locator('#settingsPanelMascott summary').click();
}
async function speed(page,value){
 await page.locator('#mascotSpeed').evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
}
async function choose(page,look){
 for(const [key,value] of Object.entries(look))await page.locator('#'+inputs[key]).selectOption(value);
}

for(const width of [1440,375])test(`Mascott tab follows Motion, supports the keyboard and fits at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await boot(page);
 await page.locator('#settingsToggle').click();
 await expect(page.locator('[data-settings-tab]')).toHaveText(['Content','Structure','Design','Motion','Mascott']);
 const rows=await page.locator('[data-settings-tab]').evaluateAll(tabs=>tabs.map(tab=>tab.getBoundingClientRect().top));
 expect(new Set(rows).size).toBe(1);
 await page.locator('#settingsTabMotion').click();await page.keyboard.press('ArrowRight');
 await expect(page.locator('#settingsTabMascott')).toBeFocused();
 await expect(page.locator('#settingsPanelMascott')).toBeVisible();
 await page.locator('#settingsPanelMascott summary').click();
 await expect(page.locator('#settingsPanelMascott #showMascot')).toHaveCount(1);
 const bounds=await page.locator('#settings').boundingBox();
 for(const id of [...Object.values(inputs),'mascotSpeed']){
  const control=page.locator('#'+id);await expect(control).toBeVisible();
  const box=await control.boundingBox();expect(box.x).toBeGreaterThanOrEqual(bounds.x);expect(box.x+box.width).toBeLessThanOrEqual(bounds.x+bounds.width);
 }
});

test('hidden mascot receives gloss and glow before it is shown',async({page})=>{
 await boot(page);await controls(page);
 await page.locator('#showMascot').uncheck();await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await expect.poll(async()=> (await pose(page)).material).toBe('gloss');
 expect((await pose(page)).outerGlow).toBe(true);
 expect(await page.locator('mascott-embed').evaluate(element=>Object.hasOwn(element,'config'))).toBe(false);
 await expect(page.locator('.agent')).toBeHidden();
 await controls(page);await page.locator('#showMascot').check();
 await expect(page.locator('.agent canvas')).toBeVisible();
 expect((await pose(page)).material).toBe('gloss');expect((await pose(page)).glowStyle).toBe('cloud');
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await expect(page.locator('.agent canvas')).toBeVisible();
 await expect.poll(async()=> (await pose(page)).material).toBe('gloss');
 expect((await pose(page)).outerGlow).toBe(true);
});

test('all materials and effects update the rendered mascot immediately',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await boot(page);await controls(page);await page.locator('#showMascot').check();
 for(const material of ['flat','glass','gloss','neon','iridescent','cosmic','liquid','aura']){
  await choose(page,{material});await expect.poll(async()=> (await pose(page)).material).toBe(material);
 }
 await choose(page,{material:'liquid',palette:'mist',glow:'edge',glowTint:'ocean',motion:'synapse',variety:'ghost'});
 await expect.poll(pose.bind(null,page)).toMatchObject({material:'liquid',palette:'mist',outerGlow:true,glowStyle:'edge',glowTint:'ocean',motion:'synapse',liquid:'ghost'});
 await choose(page,{glow:'off'});await expect.poll(async()=> (await pose(page)).outerGlow).toBe(false);
 await expect(page.locator('#mascotGlowTint')).toBeDisabled();
 await choose(page,{material:'gloss'});await expect(page.locator('#mascotVariety')).toBeDisabled();
 expect(errors).toEqual([]);
});

test('Mascott settings persist and round trip through portfolio presets',async({page})=>{
 await boot(page);await controls(page);
 await choose(page,{material:'cosmic',palette:'lavender',glow:'cloud',glowTint:'mint',motion:'currents'});await speed(page,150);
 const exported=await page.evaluate(async()=>{
  const {settingsSchema,exportSettings}=await import('/settings-transfer.js');
  return exportSettings(settingsSchema(document.getElementById('settings')),localStorage);
 });
 expect(exported.settings).toMatchObject({mascotMaterial:'cosmic',mascotPalette:'lavender',mascotGlow:'cloud',mascotGlowTint:'mint',mascotMotion:'currents',mascotSpeed:150});
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await expect.poll(async()=> (await pose(page)).material).toBe('cosmic');
 expect((await pose(page)).palette).toBe('lavender');
 await expect(page.locator('#mascotSpeed')).toHaveValue('150');await expect(page.locator('#mascotSpeedValue')).toHaveText('150%');
 const other={...exported,settings:{mascotMaterial:'liquid',mascotPalette:'mist',mascotGlow:'edge',mascotGlowTint:'ocean',mascotMotion:'synapse',mascotVariety:'ghost',mascotSpeed:50}};
 await Promise.all([page.waitForEvent('load'),page.locator('#settingsImportFile').setInputFiles({name:'mascott.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(other))})]);
 await expect(page.locator('html')).not.toHaveClass(/page-booting/,{timeout:15000});
 await expect.poll(async()=> (await pose(page)).material).toBe('liquid');
 await expect.poll(pose.bind(null,page)).toMatchObject({palette:'mist',glowStyle:'edge',glowTint:'ocean',motion:'synapse',liquid:'ghost'});
 expect(await page.locator('#mascotMaterial').inputValue()).toBe('liquid');
 expect(await page.locator('#mascotGlow').inputValue()).toBe('edge');
 await expect(page.locator('#mascotSpeed')).toHaveValue('50');await expect(page.locator('#mascotSpeedValue')).toHaveText('50%');
});

test('Speed changes the mounted mascot travel timing without a position jump',async({page})=>{
 await boot(page);await controls(page);
 const result=await page.evaluate(async()=>{
  const {mountAgent}=await import('/agent.js');
  const mounted=mountAgent(),engine=mounted.engine;
  try{
   await new Promise((resolve,reject)=>{
    const deadline=performance.now()+10000;
    function ready(){if(engine.state==='home')resolve();else if(performance.now()>deadline)reject(new Error('Test mascot did not arrive home.'));else requestAnimationFrame(ready);}
    ready();
   });
   engine.world.viewport=()=>({width:10000,height:10000});
   const destination={x:engine.position.x-100,y:engine.position.y-60};
   engine.moveTo(destination,'perched');
   await new Promise(resolve=>requestAnimationFrame(resolve));
   const duration=engine.plan.duration,position={...engine.position};
   const input=document.getElementById('mascotSpeed');input.value='300';input.dispatchEvent(new Event('input',{bubbles:true}));
   return {duration,fast:engine.plan.duration,position,after:engine.position,saved:localStorage.getItem('prem-mascot-speed')};
  }finally{mounted.destroy();}
 });
 expect(result.fast).toBeCloseTo(result.duration/3,8);expect(result.after).toEqual(result.position);expect(result.saved).toBe('300');
 await expect(page.locator('#mascotSpeedValue')).toHaveText('300%');
});
