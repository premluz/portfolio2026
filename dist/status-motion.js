import {EASE} from './motion-tokens.js';
// Shared presence motion for live input states and transient notifications.
export function createStatusMotion(node,{reduced=()=>false}={}){
 let animation=null,epoch=0,visible=!node.hidden;
 const cancel=()=>{animation?.cancel();animation=null;};
 const set=(show,{immediate=false,onHidden=()=>{}}={})=>{
  if(show===visible&&!immediate)return;
  visible=show;const generation=++epoch;
  const current=animation&&typeof getComputedStyle==='function'?getComputedStyle(node):null;
  const from=current?{opacity:current.opacity,transform:current.transform}:{opacity:show?0:1,transform:show?'translateY(8px)':'translateY(0)'};
  cancel();
  if(immediate||reduced()||!node.animate){node.hidden=!show;if(!show)onHidden();return;}
  node.hidden=false;
  animation=node.animate([from,{opacity:show?1:0,transform:show?'translateY(0)':'translateY(8px)'}],{duration:show?240:200,easing:show?EASE.settle:EASE.leave,fill:'both'});
  const playing=animation;
  playing.finished.then(()=>{if(generation!==epoch)return;node.hidden=!show;cancel();if(!show)onHidden();},()=>{});
 };
 return {set,get visible(){return visible;},destroy(){++epoch;cancel();}};
}
