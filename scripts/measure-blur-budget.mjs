// WP-17 item 2: count backdrop-filter layers per route, measured inside the page in one process.
// Usage: start `PORT=3919 HOST=127.0.0.1 node deploy/node-server.mjs --dev`, then `node scripts/measure-blur-budget.mjs [baseUrl]`.
// --dev matters: without it the server serves the built dist/client copy, not the sources (FACT-012).
import {chromium} from '@playwright/test';
import {BLUR_ROUTES,BLUR_VIEWPORTS,SCROLL_STOPS,openRoute,scrollTo,countBlur} from '../tests/visual/blur-layers.mjs';
const BASE=process.argv[2]??'http://127.0.0.1:3919';

const browser=await chromium.launch();
for(const viewport of BLUR_VIEWPORTS){
 const page=await browser.newPage({viewport,baseURL:BASE});
 for(const route of BLUR_ROUTES){
  await openRoute(page,route);
  const stops=[];
  for(const stop of SCROLL_STOPS){await scrollTo(page,stop);stops.push({stop,...await page.evaluate(countBlur)});}
  const peak=stops.reduce((a,b)=>b.inView>a.inView?b:a);
  console.log(JSON.stringify({viewport:`${viewport.width}x${viewport.height}`,route:route[0],totalInDom:peak.total,inViewByStop:stops.map(s=>s.inView),peak:{stop:peak.stop,inView:peak.inView,maxBlurPx:peak.maxBlurPx,viewportCoverPct:peak.viewportCoverPct,layers:peak.layers}}));
 }
 await page.close();
}
await browser.close();
