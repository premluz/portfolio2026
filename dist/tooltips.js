// One unclipped portal serves pointer, keyboard and touch focus alike. Pointer hover waits a moment so passing over
// controls stays quiet; moving between controls right after one tooltip closed shows the next at once. Keyboard focus is immediate.
// A tooltip dismissed while the pointer rests on its control (click, Escape, scroll) stays hidden until the pointer leaves.
export const TOOLTIP_HOVER_DELAY=350,TOOLTIP_WARM_WINDOW=600;
export function installTooltips(root=document,{delay=TOOLTIP_HOVER_DELAY,warm=TOOLTIP_WARM_WINDOW,schedule=setTimeout,cancel=clearTimeout,now=()=>Date.now()}={}){
 const tip=document.createElement('div');tip.id='site-tooltip';tip.className='site-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 let active=null,previousDescription=null,pending=null,pendingNode=null,closedAt=-Infinity,pointerNode=null,dismissedNode=null,pressedNode=null;
 function cancelPending(){if(pending!==null)cancel(pending);pending=null;pendingNode=null;}
 function hide(dismiss=true){cancelPending();if(active){if(dismiss&&active===pointerNode)dismissedNode=active;closedAt=now();if(previousDescription)active.setAttribute('aria-describedby',previousDescription);else active.removeAttribute('aria-describedby');}active=null;tip.hidden=true;}
 function position(){if(!active)return;const r=active.getBoundingClientRect();tip.style.left='0px';tip.style.top='0px';const t=tip.getBoundingClientRect(),above=r.top>t.height+20;tip.style.left=Math.max(12,Math.min(innerWidth-t.width-12,r.left+(r.width-t.width)/2))+'px';tip.style.top=(above?r.top-t.height-10:r.bottom+10)+'px';tip.style.transformOrigin=above?'center bottom':'center top';}
 function show(node){if(active===node)return;hide(false);active=node;previousDescription=node.getAttribute('aria-describedby');tip.textContent=node.dataset.tooltip;tip.hidden=false;node.setAttribute('aria-describedby',[previousDescription,tip.id].filter(Boolean).join(' '));position();}
 const find=target=>target?.closest?.('[data-tooltip]');
 root.addEventListener('pointerover',e=>{const node=find(e.target);if(!node||e.pointerType==='touch'||node.contains(e.relatedTarget))return;pointerNode=node;if(dismissedNode&&dismissedNode!==node)dismissedNode=null;if(active===node||pendingNode===node||dismissedNode===node)return;cancelPending();if(now()-closedAt<warm||active){show(node);return;}pendingNode=node;pending=schedule(()=>{pending=null;pendingNode=null;show(node);},delay);});
 root.addEventListener('pointerout',e=>{const left=node=>node&&node.contains(e.target)&&!node.contains(e.relatedTarget);if(left(pendingNode))cancelPending();if(left(pointerNode))pointerNode=null;if(left(dismissedNode))dismissedNode=null;if(left(active)&&document.activeElement!==active)hide(false);});
 // A mouse click focuses the control, which must not bring back the tooltip the press just dismissed.
 root.addEventListener('focusin',e=>{const node=find(e.target);if(node&&node===pressedNode){pressedNode=null;return;}if(node&&node.dataset.tooltipPointerOnly===undefined)show(node);else hide();});
 root.addEventListener('focusout',e=>{if(active===e.target)hide();});
 root.addEventListener('pointerdown',e=>{const node=find(e.target);pressedNode=e.pointerType==='touch'?null:node;if(e.pointerType==='touch'&&node?.classList.contains('setting-info'))show(node);else hide();});
 addEventListener('keydown',e=>{pressedNode=null;if(e.key==='Escape')hide();});addEventListener('resize',hide);addEventListener('scroll',hide,true);
}
