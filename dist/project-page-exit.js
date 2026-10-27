import {EASE,DURATION,DISTANCE} from './motion-tokens.js';

// Leaving a project page without a card to morph back into: the page recedes towards the reader's current view,
// shrinking slightly and dropping as it fades, while any text still on screen steps out bottom-up first.
// The origin is the middle of the viewport, not the top of the page, so a long, scrolled page shrinks where it is read.
const TEXT='h1,.detail-caption,.project-client,.project-summary,[data-detail-fact],.detail-media-actions';

export function exitDuration(duration){
 return Math.round(Math.min(DURATION.exitMax,Math.max(DURATION.exitMin,duration*DURATION.exitShare)));
}
// Every other page leaves with the same timing and curve, as a plain fade in place.
export function pageFadeExit(node,{duration=400,reduced=false}={}){
 if(reduced||!node?.animate)return null;
 return node.animate([{opacity:1},{opacity:0}],{duration:exitDuration(duration),easing:EASE.leave,fill:'forwards'});
}
export function visibleExitText(root,{viewport=globalThis.innerHeight}={}){
 return [...(root?.querySelectorAll?.(TEXT)||[])].filter(node=>{const r=node.getBoundingClientRect();return r.height>0&&r.bottom>0&&r.top<viewport;}).reverse();
}
export function projectPageExit(root,{duration=400,reduced=false,viewport=globalThis.innerHeight,viewportWidth=globalThis.innerWidth}={}){
 if(reduced||!root?.animate)return null;
 const total=exitDuration(duration),text=visibleExitText(root,{viewport});
 const step=text.length>1?Math.min(DURATION.staggerStep,total*DURATION.staggerSpan/(text.length-1)):0;
 const textDuration=Math.max(80,total-step*(text.length-1)),rect=root.getBoundingClientRect();
 const animations=text.map((node,index)=>node.animate([{opacity:getComputedStyle(node).opacity||'1'},{opacity:0}],{duration:textDuration,delay:Math.round(index*step),easing:EASE.leave,fill:'forwards'}));
 root.style.transformOrigin=`${viewportWidth/2-rect.left}px ${viewport/2-rect.top}px`;
 const page=root.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:`translateY(${DISTANCE.exitDrop}px) scale(${DISTANCE.exitScale})`}],{duration:total,easing:EASE.leave,fill:'forwards'});
 animations.push(page);
 return {finished:page.finished,cancel(){for(const animation of animations)animation.cancel();root.style.transformOrigin='';}};
}
