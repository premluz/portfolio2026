import {stepDockSpring} from './dock-morph.js';

// Closed-form damped spring: a small overshoot for emergence, no frame-rate
// dependent integration. Exit uses the dock's monotone spring instead.
export function stepActionSpring(position,velocity,target,seconds,duration=280){
 const dt=Math.min(.032,Math.max(0,seconds)),omega=7/(duration/1000),alpha=omega*.62,frequency=omega*Math.sqrt(1-.62**2),offset=position-target;
 const b=(velocity+alpha*offset)/frequency,c=Math.cos(frequency*dt),s=Math.sin(frequency*dt),decay=Math.exp(-alpha*dt),wave=offset*c+b*s;
 return {position:target+decay*wave,velocity:decay*((-offset*frequency*s+b*frequency*c)-alpha*wave)};
}

// Stable action ids own their DOM. A removed action is taken out of layout and
// semantics immediately; its last visual pose recedes while survivors reflow.
export class ContextActionPresence {
 constructor(row,{onAction=()=>{},reduced=()=>false}={}){Object.assign(this,{row,onAction,reduced});this.items=new Map();this.layoutUntil=0;}
 update(actions,{immediate=false}={}){
  const now=performance.now(),instant=immediate||this.reduced(),root=this.row.getBoundingClientRect(),old=new Map(),focusedId=document.activeElement?.dataset?.contextAction;let exitIndex=0;
  for(const [id,item] of this.items){const rect=item.slot.getBoundingClientRect();old.set(id,{left:rect.left-root.left,top:rect.top-root.top,width:rect.width,height:rect.height,screenLeft:rect.left,screenTop:rect.top});}
  const ids=new Set(actions.map(action=>action.id));let changed=false;
  for(const [id,item] of this.items)if(!ids.has(id)&&item.target!==0){
   changed=true;item.target=0;item.delay=now+exitIndex++*35;item.button.disabled=true;item.button.tabIndex=-1;item.slot.inert=true;item.slot.setAttribute('aria-hidden','true');item.slot.dataset.exiting='true';
   item.layout?.cancel();item.layout=null;const r=old.get(id);item.exit=r;Object.assign(item.slot.style,{position:'absolute',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
   if(this.row.contains(document.activeElement)&&item.slot.contains(document.activeElement))this.focusReplacement=actions[Math.min([...this.items.keys()].indexOf(id),actions.length-1)]?.id;
   if(instant){item.slot.remove();this.items.delete(id);}
  }
  actions.forEach((action,index)=>{
   let item=this.items.get(action.id);
   if(!item){
    changed=true;const slot=document.createElement('span'),presence=document.createElement('span'),button=document.createElement(action.href?'a':'button');slot.className='composer-context-slot';presence.className='composer-context-presence';if(!action.href)button.type='button';button.dataset.contextAction=action.id;presence.append(button);slot.append(presence);
    item={slot,presence,button,position:instant?1:0,velocity:0,target:1,delay:now+index*35};this.items.set(action.id,item);
    button.onclick=event=>{if(item.target!==1||item.slot.inert||this.row.inert||button.disabled){event?.preventDefault();return;}if(!item.action.href)this.onAction(item.action.id,button);};
   }else if(item.target===0){changed=true;item.target=1;item.exit=null;item.slot.inert=false;item.slot.removeAttribute('aria-hidden');delete item.slot.dataset.exiting;for(const key of ['position','left','top','width','height'])item.slot.style[key]='';item.button.disabled=false;item.button.tabIndex=0;item.delay=now;}
   const shape=JSON.stringify([action.label,action.text,action.path,action.tooltip]);if(item.shape!==shape){changed=true;item.shape=shape;item.button.setAttribute('aria-label',action.label);if(action.tooltip)item.button.dataset.tooltip=action.tooltip;else delete item.button.dataset.tooltip;
    if(action.text){item.button.className='';item.button.textContent=action.label;}else{item.button.className='composer-context-icon';item.button.innerHTML=`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${action.path}"/></svg>`;}
   }
   item.action=action;const leftMargin=action.pushRight?'auto':'';if(item.slot.style.marginLeft!==leftMargin){changed=true;item.slot.style.marginLeft=leftMargin;}
   if(action.compactLabel)item.button.dataset.compactLabel=action.compactLabel;else delete item.button.dataset.compactLabel;
   if(action.href){item.button.setAttribute('href',action.href);if(action.external){item.button.setAttribute('target','_blank');item.button.setAttribute('rel','noopener noreferrer');}}
   const next=actions[index+1],margin=next&&next.group!==action.group?(action.group==='primary'?'18px':'14px'):'';if(item.slot.style.marginRight!==margin){changed=true;item.slot.style.marginRight=margin;}
   item.slot.dataset.groupEnd=String(!!margin);
   const previous=actions[index-1];item.slot.dataset.groupSolo=String(previous?.group!==action.group&&next?.group!==action.group);
   // insertBefore leaves retained buttons mounted, focused and in identity.
   const reference=this.row.children[index];if(reference!==item.slot){changed=true;this.row.insertBefore(item.slot,reference||null);}
   if(instant){item.position=1;item.velocity=0;}
  });
  if(changed&&!instant){
   for(const action of actions){const item=this.items.get(action.id),before=old.get(action.id);if(!before)continue;item.layout?.cancel();const x=before.left-item.slot.offsetLeft,y=before.top-item.slot.offsetTop;if(Math.abs(x)+Math.abs(y)>.1)item.layout=item.slot.animate([{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:200,easing:'cubic-bezier(.2,0,0,1)'});}
   this.layoutUntil=now+200;
  }else if(instant){this.layoutUntil=0;for(const item of this.items.values()){item.layout?.cancel();item.layout=null;}}
  if(focusedId&&this.items.get(focusedId)?.target===1&&document.activeElement!==this.items.get(focusedId).button&&!this.row.inert)this.items.get(focusedId).button.focus({preventScroll:true});
  this.paint(now);return changed;
 }
 tick(now,seconds){
  for(const [id,item] of this.items){if(now<item.delay)continue;if(this.reduced()){item.position=item.target;item.velocity=0;}else if(item.position!==item.target||item.velocity){const next=(item.target?stepActionSpring:stepDockSpring)(item.position,item.velocity,item.target,seconds,item.target?280:150);item.position=next.position;item.velocity=next.velocity;if(Math.abs(item.position-item.target)<.002&&Math.abs(item.velocity)<.025){item.position=item.target;item.velocity=0;}}
   if(!item.target&&item.position===0){item.layout?.cancel();item.slot.remove();this.items.delete(id);}
  }
  this.paint(now);return this.moving(now);
 }
 paint(now){
  const root=this.row.getBoundingClientRect();for(const item of this.items.values()){
   const p=item.position,scale=item.target ? .62+.38*p : .62+.38*p+.16*Math.sin(Math.PI*Math.max(0,Math.min(1,p)));
   item.slot.inert=!item.target||p<.65;
   item.presence.style.opacity=String(Math.max(0,Math.min(1,p)));item.presence.style.transform=`translateZ(${(-32*(1-p)).toFixed(3)}px) scale(${scale.toFixed(4)})`;
   item.presence.style.willChange=item.position!==item.target||item.velocity?'transform,opacity':'';
   if(item.exit){item.slot.style.left=(item.exit.screenLeft-root.left)+'px';item.slot.style.top=(item.exit.screenTop-root.top)+'px';}
  }
  if(!this.row.inert&&this.focusReplacement){this.items.get(this.focusReplacement)?.button.focus({preventScroll:true});this.focusReplacement=null;}
 }
 moving(now=performance.now()){return now<this.layoutUntil||[...this.items.values()].some(item=>item.position!==item.target||item.velocity);}
 destroy(){for(const item of this.items.values()){item.layout?.cancel();item.slot.remove();}this.items.clear();}
}
