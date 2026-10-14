import {createStatusMotion} from './status-motion.js';
// Each feature owns a keyed status; separate features can coexist in a stack.
export function createSiteToast(node,{duration=3000,reduced=()=>false}={}){
 const entries=new Map();let epoch=0;
 node.setAttribute('role','log');node.setAttribute('aria-live','polite');node.setAttribute('aria-atomic','false');
 const remove=(key,item)=>{if(entries.get(key)!==item)return;item.motion.destroy();item.el.remove();entries.delete(key);node.hidden=!entries.size;};
 const clear=(key,{immediate=false}={})=>{const item=entries.get(key);if(!item)return;clearTimeout(item.timer);item.motion.set(false,{immediate,onHidden:()=>remove(key,item)});};
 const hide=()=>{for(const key of [...entries.keys()])clear(key,{immediate:true});node.hidden=true;};
 const show=(message,{key=String(message),duration:ttl=duration,tone=ttl===0?'neutral':'success'}={})=>{
  if(!message){clear(key);return;}
  let item=entries.get(key);
  if(!item){item={el:document.createElement('div')};item.el.className='site-status-message glass-surface';item.el.hidden=true;item.motion=createStatusMotion(item.el,{reduced});entries.set(key,item);node.append(item.el);}
  clearTimeout(item.timer);item.epoch=++epoch;
  item.el.setAttribute('data-status-tone',['error','success','neutral'].includes(tone)?tone:'neutral');item.el.textContent=String(message);node.hidden=false;
  item.motion.set(true);
  const generation=item.epoch;
  if(ttl>0)item.timer=setTimeout(()=>{
   if(entries.get(key)!==item||item.epoch!==generation)return;
   clear(key);
  },ttl);
  // Bound transient notices while leaving persistent system states intact.
  item.persistent=ttl===0;
  const transient=[...entries].filter(([,value])=>!value.persistent);
  while(transient.length>3)clear(transient.shift()[0],{immediate:true});
 };
 return {show,clear,hide,destroy:hide};
}
