// Shared by tests/visual/blur-budget.spec.mjs and scripts/measure-blur-budget.mjs (WP-17 item 2, TASK-057).
// Each route names the element that proves it rendered, so a route that falls back to home fails loudly.
export const BLUR_ROUTES=[['home','/','[data-home-product-gallery]'],['project','/#galachain','.surface.detail'],['assistant','/#assistant','#assistantInlineComposer']];
export const BLUR_VIEWPORTS=[{width:1440,height:900},{width:390,height:844}];
export const SCROLL_STOPS=[0,.33,.66,1];

export async function openRoute(page,[name,path,proof]){
 await page.goto(path,{waitUntil:'load'});
 await page.waitForFunction(()=>!document.documentElement.classList.contains('page-booting'));
 await page.locator(proof).first().waitFor({state:'visible',timeout:10000}).catch(error=>{throw Error(`Route ${name} (${path}) did not render ${proof}`,{cause:error});});
 await page.waitForTimeout(1500);
}

export async function scrollTo(page,stop){
 await page.evaluate(f=>window.scrollTo({top:(document.scrollingElement.scrollHeight-innerHeight)*f,behavior:'instant'}),stop);
 await page.waitForTimeout(500);
}

// Runs in the page: every element and ::before/::after whose computed backdrop-filter is not none.
export function countBlur(){
 const rows=[];const vw=innerWidth,vh=innerHeight;
 const describe=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+(el.classList.length?'.'+[...el.classList].slice(0,2).join('.'):'');
 for(const el of document.querySelectorAll('*')){
  for(const pseudo of [null,'::before','::after']){
   const style=getComputedStyle(el,pseudo);const filter=style.backdropFilter||style.webkitBackdropFilter;
   if(!filter||filter==='none')continue;
   if(pseudo&&(style.content==='none'||style.content==='normal'))continue;
   const r=el.getBoundingClientRect();
   const painted=style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0&&r.width>0&&r.height>0&&!el.closest('[hidden]');
   const inView=painted&&r.right>0&&r.bottom>0&&r.left<vw&&r.top<vh;
   const blur=Number(/blur\(([\d.]+)px\)/.exec(filter)?.[1]??0);
   const area=inView?Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0)):0;
   rows.push({who:describe(el)+(pseudo??''),inView,blur,areaPct:+(100*area/(vw*vh)).toFixed(1)});
  }
 }
 const seen=rows.filter(r=>r.inView);
 return {total:rows.length,inView:seen.length,maxBlurPx:Math.max(0,...seen.map(r=>r.blur)),maxAreaPct:Math.max(0,...seen.map(r=>r.areaPct)),viewportCoverPct:+seen.reduce((s,r)=>s+r.areaPct,0).toFixed(1),layers:seen.map(r=>`${r.who} ${r.blur}px ${r.areaPct}%`)};
}
