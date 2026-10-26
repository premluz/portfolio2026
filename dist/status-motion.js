import {EASE,DISTANCE} from './motion-tokens.js';
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
  const frames=show?[from,{offset:.62,opacity:1,transform:`translateY(${-DISTANCE.settlePast}px)`},{opacity:1,transform:'translateY(0)'}]:[from,{opacity:0,transform:'translateY(8px)'}];
  animation=node.animate(frames,{duration:show?240:200,easing:show?EASE.settle:EASE.leave,fill:'both'});
  const playing=animation;
  playing.finished.then(()=>{if(generation!==epoch)return;node.hidden=!show;cancel();if(!show)onHidden();},()=>{});
 };
 return {set,get visible(){return visible;},destroy(){++epoch;cancel();}};
}
