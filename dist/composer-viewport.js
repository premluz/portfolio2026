// VisualViewport shrinks when an overlay keyboard opens while the layout
// viewport (and fixed elements) may retain their original height.
export function composerKeyboardInset(layout,viewport,engaged){
 if(!engaged||!viewport||layout.width>750||Math.abs((viewport.scale||1)-1)>.03)return 0;
 const occluded=Math.max(0,layout.height-(viewport.offsetTop+viewport.height));
 return occluded>85?Math.round(occluded):0;
}
export function chatEndScrollTarget(lastRect,dockRect,{scroll=0,visibleBottom=Infinity,gap=24}={}){
 return Math.max(0,scroll+lastRect.bottom-(Math.min(dockRect.top,visibleBottom-16)-gap));
}
export function mountComposerViewport({input,environment=globalThis,onSettled=()=>{}}){
 const viewport=environment.visualViewport,root=environment.document.documentElement;
 let engaged=environment.document.activeElement===input,raf=0,settle=false,inset=0,preparing=false,preparation=null,finishPreparation=null;
 const refresh=()=>{
  raf=0;const shouldSettle=settle;settle=false;
  const focused=environment.document.activeElement===input;
  if(focused)engaged=true;
  const next=composerKeyboardInset({width:environment.innerWidth,height:environment.innerHeight},viewport,engaged),previous=inset;
  if(next!==inset){inset=next;root.style.setProperty('--composer-keyboard-inset',inset+'px');environment.dispatchEvent(new Event('composer-viewport-change'));}
  if(!preparing&&shouldSettle&&(focused||engaged||previous>0))onSettled();
  if(!focused&&!next)engaged=false;
 };
 const schedule=(shouldSettle=false)=>{settle=settle||shouldSettle;if(!raf)raf=environment.requestAnimationFrame(refresh);};
 const resize=()=>schedule(true),pan=()=>schedule(false),focus=()=>{engaged=true;schedule(true);},blur=()=>schedule(false);
 viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',pan);environment.addEventListener('resize',resize);input.addEventListener('focus',focus);input.addEventListener('blur',blur);schedule();
 const prepareNavigation=()=>{
  if(preparation)return preparation;
  const focused=environment.document.activeElement===input;
  if(!focused&&!engaged&&!inset)return Promise.resolve();
  preparing=true;input.blur();engaged=false;
  if(!viewport||environment.innerWidth>1024){preparing=false;schedule();return Promise.resolve();}
  preparation=new Promise(resolve=>{
   let frame=0,timer=0,closedFrames=0,finished=false;
   const finish=()=>{if(finished)return;finished=true;environment.cancelAnimationFrame(frame);environment.clearTimeout(timer);preparing=false;preparation=null;finishPreparation=null;inset=0;root.style.setProperty('--composer-keyboard-inset','0px');environment.dispatchEvent(new Event('composer-viewport-change'));resolve();};
   finishPreparation=finish;
   const check=()=>{
    // Normalise physical height even if an older input has already caused
    // browser zoom. Deliberate pinch zoom alone does not look like a keyboard.
    const keyboard=environment.innerHeight-viewport.height*(viewport.scale||1);
    closedFrames=keyboard<=85?closedFrames+1:0;
    if(closedFrames>=2){finish();return;}frame=environment.requestAnimationFrame(check);
   };
   // A bounded wait follows the actual viewport; it adds no delay when closed.
   timer=environment.setTimeout(finish,650);frame=environment.requestAnimationFrame(check);
  });
  return preparation;
 };
 return {refresh:()=>schedule(true),prepareNavigation,destroy(){finishPreparation?.();environment.cancelAnimationFrame(raf);viewport?.removeEventListener('resize',resize);viewport?.removeEventListener('scroll',pan);environment.removeEventListener('resize',resize);input.removeEventListener('focus',focus);input.removeEventListener('blur',blur);root.style.removeProperty('--composer-keyboard-inset');}};
}
