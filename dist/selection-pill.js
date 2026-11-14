// One background element per group of connected items. It rests on the current item, follows the
// pointer or keyboard focus to another, and returns when they leave, so the highlight glides instead of
// switching from item to item. CSS owns the look and the motion; this only says where the pill is.
const PILL_CLASS='selection-pill',GROUP_CLASS='has-selection-pill';

export function mountSelectionPill(group,{items='a,button',current='.active'}={}){
 if(!group)throw Error('Selection pill needs a group element');
 const pill=group.ownerDocument.createElement('span');
 pill.className=PILL_CLASS;pill.setAttribute('aria-hidden','true');
 group.prepend(pill);group.classList.add(GROUP_CLASS);
 let pointed=null,focused=null,placed=false;
 const member=target=>{const node=target?.closest?.(items);return node&&node.parentElement===group?node:null;};
 const usable=node=>node&&node.isConnected&&!node.disabled&&node.offsetWidth>0;
 const target=()=>[pointed,focused,group.querySelector(':scope>'+current)].find(usable)??null;
 function place(){
  const node=target();
  if(!node){pill.dataset.shown='false';placed=false;return;}
  // The first placement, or one after the group was hidden, must not slide in from a stale position.
  pill.dataset.instant=String(!placed);
  for(const [name,value] of [['x',node.offsetLeft],['y',node.offsetTop],['width',node.offsetWidth],['height',node.offsetHeight]])pill.style.setProperty('--selection-pill-'+name,value+'px');
  pill.style.setProperty('--selection-pill-radius',getComputedStyle(node).borderRadius);
  pill.dataset.shown='true';
  if(!placed){void pill.offsetWidth;pill.dataset.instant='false';placed=true;}
 }
 const over=event=>{if(event.pointerType==='touch')return;const node=member(event.target);if(node){pointed=node;place();}};
 const out=event=>{if(member(event.target)&&!member(event.relatedTarget)){pointed=null;place();}};
 const focusIn=event=>{const node=member(event.target);if(node?.matches(':focus-visible')){focused=node;place();}};
 const focusOut=()=>{focused=null;place();};
 const handlers=[['pointerover',over],['pointerout',out],['focusin',focusIn],['focusout',focusOut]];
 for(const [type,handler] of handlers)group.addEventListener(type,handler);
 // The current item changes by class or state, and items resize with text size or when a hidden menu opens.
 const states=new MutationObserver(place);
 states.observe(group,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-pressed','aria-checked','disabled']});
 const sizes=new ResizeObserver(place);
 sizes.observe(group);for(const node of group.querySelectorAll(':scope>'+items.split(',').join(',:scope>')))sizes.observe(node);
 place();
 return {place,destroy(){
  for(const [type,handler] of handlers)group.removeEventListener(type,handler);
  states.disconnect();sizes.disconnect();pill.remove();group.classList.remove(GROUP_CLASS);
 }};
}
