// One unclipped portal serves pointer, keyboard and touch focus alike.
export function installTooltips(root=document){
 const tip=document.createElement('div');tip.id='site-tooltip';tip.className='site-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 let active=null,previousDescription=null;
 function hide(){if(active){if(previousDescription)active.setAttribute('aria-describedby',previousDescription);else active.removeAttribute('aria-describedby');}active=null;tip.hidden=true;}
 function position(){if(!active)return;const r=active.getBoundingClientRect();tip.style.left='0px';tip.style.top='0px';const t=tip.getBoundingClientRect(),above=r.top>t.height+20;tip.style.left=Math.max(12,Math.min(innerWidth-t.width-12,r.left+(r.width-t.width)/2))+'px';tip.style.top=(above?r.top-t.height-10:r.bottom+10)+'px';tip.style.transformOrigin=above?'center bottom':'center top';}
 function show(node){if(active===node)return;hide();active=node;previousDescription=node.getAttribute('aria-describedby');tip.textContent=node.dataset.tooltip;tip.hidden=false;node.setAttribute('aria-describedby',[previousDescription,tip.id].filter(Boolean).join(' '));position();}
 const find=target=>target?.closest?.('[data-tooltip]');
 root.addEventListener('pointerover',e=>{const node=find(e.target);if(node&&!node.contains(e.relatedTarget)&&e.pointerType!=='touch')show(node);});
 root.addEventListener('pointerout',e=>{if(active&&active.contains(e.target)&&!active.contains(e.relatedTarget)&&document.activeElement!==active)hide();});
 root.addEventListener('focusin',e=>{const node=find(e.target);if(node&&node.dataset.tooltipPointerOnly===undefined)show(node);else hide();});
 root.addEventListener('focusout',e=>{if(active===e.target)hide();});
 root.addEventListener('pointerdown',e=>{const node=find(e.target);if(e.pointerType==='touch'&&node?.classList.contains('setting-info'))show(node);else hide();});
 addEventListener('keydown',e=>{if(e.key==='Escape')hide();});addEventListener('resize',hide);addEventListener('scroll',hide,true);
}
