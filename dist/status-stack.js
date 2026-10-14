export function visibleStatusRect(rect,clipPath='none'){
 const inset=/^inset\(([-\d.]+)px\s+[-\d.]+px\s+([-\d.]+)px/.exec(clipPath);
 if(!inset)return rect;
 const top=Math.max(0,Number(inset[1])),bottom=Math.max(0,Number(inset[2]));return {...rect,top:rect.top+top,height:Math.max(0,rect.height-top-bottom)};
}
export function statusStackBottom(rects,viewportHeight,stackHeight,gap=12){
 const top=Math.min(viewportHeight,...rects.filter(rect=>rect&&rect.height>0).map(rect=>rect.top));
 return Math.max(12,Math.min(viewportHeight-top+gap,viewportHeight-stackHeight-16));
}
// Live input states and transient notices overlay the menu in one portal.
// Suggestions still get clearance; the open menu never displaces the stack.
export function mountStatusStack({dock,hud,messages,obstacles=()=>[]}={}){
 const region=document.createElement('div');region.id='composerStatusStack';region.setAttribute('aria-label','Site status');
 region.append(hud,messages);document.body.append(region);hud.setAttribute('aria-live','polite');hud.setAttribute('aria-atomic','false');
 hud.querySelectorAll('.input-status').forEach(node=>node.classList.add('glass-surface'));
 let raf=0,height=0;const watched=new Set([region,dock]);
 const position=()=>{
  raf=0;const currentHeight=region.getBoundingClientRect().height;
  // The portal sits outside the dock, so copy its resolved material tokens.
  // This also preserves the developer's always-dark navigation preference.
  const dockStyle=getComputedStyle(dock);
  for(const name of ['--nav-glass-rgb','--dock-glass-alpha','--dock-glass-blur','--dock-backdrop-brightness','--dock-outline','--nav-highlight','--nav-shadow','--composer-text-ink','--ink','--nav-item-hover','--nav-rounding']){
   const value=dockStyle.getPropertyValue(name);if(region.style.getPropertyValue(name)!==value)region.style.setProperty(name,value);
  }
  const nodes=[dock,...obstacles()].filter(node=>node&&!node.hidden&&getComputedStyle(node).display!=='none');
  for(const node of nodes){if(!watched.has(node)){watched.add(node);resize.observe(node);mutations.observe(node,{attributes:true,attributeFilter:['hidden','style','class']});}}
  const bottom=statusStackBottom(nodes.map(node=>visibleStatusRect(node.getBoundingClientRect(),getComputedStyle(node).clipPath)),innerHeight,currentHeight);
  if(region.style.bottom!==bottom+'px')region.style.bottom=bottom+'px';
  if(Math.abs(currentHeight-height)>.5){height=currentHeight;dispatchEvent(new Event('composer-status-resize'));}
 };
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(position);};
 const mutations=new MutationObserver(records=>{if(records.some(record=>record.target!==region||record.attributeName!=='style'))schedule();});
 mutations.observe(region,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 mutations.observe(dock,{attributes:true,attributeFilter:['class','style']});
 mutations.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});
 for(const node of obstacles().filter(Boolean))mutations.observe(node,{attributes:true,attributeFilter:['hidden','style','class']});
 const resize=new ResizeObserver(schedule);resize.observe(region);resize.observe(dock);
 addEventListener('resize',schedule);addEventListener('composer-overlay-change',schedule);addEventListener('composer-viewport-change',schedule);schedule();
 return {region,refresh:schedule,destroy(){cancelAnimationFrame(raf);mutations.disconnect();resize.disconnect();removeEventListener('resize',schedule);removeEventListener('composer-overlay-change',schedule);removeEventListener('composer-viewport-change',schedule);region.remove();}};
}
