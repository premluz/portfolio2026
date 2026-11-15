import {test,expect} from '@playwright/test';
import {BLUR_ROUTES,BLUR_VIEWPORTS,SCROLL_STOPS,openRoute,scrollTo,countBlur} from './blur-layers.mjs';

// Cap proposed in TASK-057 from the 2026-11-15 measurement (peak 6 layers, 22px, 14.9% coverage).
// It only stops growth; raise it with the owner, not to get green.
const MAX_LAYERS_IN_VIEW=6;
const MAX_LAYER_AREA_PCT=25;
const BLUR_CEILING_TOKEN='--dock-glass-blur';

for(const viewport of BLUR_VIEWPORTS)for(const route of BLUR_ROUTES){
 test(`blur budget: ${route[0]} at ${viewport.width}x${viewport.height}`,async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize(viewport);
  await openRoute(page,route);
  const ceilingPx=parseFloat(await page.evaluate(name=>getComputedStyle(document.documentElement).getPropertyValue(name),BLUR_CEILING_TOKEN));
  expect(ceilingPx,`${BLUR_CEILING_TOKEN} resolves to a length`).toBeGreaterThan(0);
  for(const stop of SCROLL_STOPS){
   await scrollTo(page,stop);
   const count=await page.evaluate(countBlur);
   const where=`${route[0]} scrolled ${stop}: ${count.layers.join(', ')}`;
   expect(count.inView,`blurred layers in view, ${where}`).toBeLessThanOrEqual(MAX_LAYERS_IN_VIEW);
   expect(count.maxBlurPx,`blur radius, ${where}`).toBeLessThanOrEqual(ceilingPx);
   expect(count.maxAreaPct,`largest blurred layer, ${where}`).toBeLessThanOrEqual(MAX_LAYER_AREA_PCT);
  }
 });
}
