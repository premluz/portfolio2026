import {EASE,DURATION,BACKDROP} from './motion-tokens.js';
import {backdropSources} from './backdrop-sources.js';

// Project detail backdrop: one fixed layer behind the page. A project's photo rises in calmly as the page
// lands, crossfades when next/previous changes project, leaves on the exit timing, and drifts with scroll.
// Nothing runs at rest: the scroll handler only schedules a frame while a backdrop is showing.
const exitDuration=duration=>Math.min(DURATION.exitMax,Math.max(DURATION.exitMin,duration*DURATION.exitShare));

// Covering a full-height viewport crops a ~3:1 panorama to roughly three viewport-heights wide, wider
// than `100vw` suggests, so the detail layer always takes the largest copy (~100 KB) instead of a srcset.
function slide(src){
 const node=document.createElement('img');node.className='project-backdrop-image';node.alt='';node.decoding='async';node.src=src;return node;
}

export function createProjectBackdrop({reduced=()=>false,duration=()=>400,parent=document.body,before=null}={}){
 const layer=document.createElement('div');layer.className='project-backdrop';layer.setAttribute('aria-hidden','true');layer.hidden=true;
 const track=document.createElement('div');track.className='project-backdrop-track';layer.append(track);
 parent.insertBefore(layer,before);
 let current=null,url=null,frame=0;
 const drift=()=>{frame=0;if(layer.hidden||reduced()){track.style.transform='';return;}
  const shift=Math.min(scrollY*BACKDROP.parallax,innerHeight*BACKDROP.parallaxMax);track.style.transform=`translate3d(0,${-shift}px,0)`;};
 const onScroll=()=>{if(!frame&&!layer.hidden)frame=requestAnimationFrame(drift);};
 addEventListener('scroll',onScroll,{passive:true});
 const leave=node=>{
  if(!node)return;
  if(reduced()){node.remove();return;}
  node.animate([{opacity:getComputedStyle(node).opacity},{opacity:0}],{duration:exitDuration(duration()),easing:EASE.leave,fill:'forwards'}).finished
   .then(()=>node.remove(),error=>{node.remove();if(error?.name!=='AbortError')throw error;});
 };
 const enter=node=>{
  track.append(node);
  if(reduced())return;
  node.animate([{opacity:0,transform:`scale(${BACKDROP.enterScale})`},{opacity:1,transform:'scale(1)'}],{duration:duration()*BACKDROP.enterShare,easing:EASE.gentle,fill:'backwards'});
 };
 return {
  /** Shows the backdrop for a project card (or hides it for null). Same image: no change. */
  sync(project){
   const next=project?.background||null;if(next===url)return;url=next;
   const previous=current;current=null;leave(previous);
   const source=backdropSources(next);
   if(!source){if(!previous)layer.hidden=true;else setTimeout(()=>{if(!current)layer.hidden=true;},exitDuration(duration()));return;}
   layer.hidden=false;current=slide(source.src);enter(current);drift();
  },
  destroy(){removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);layer.remove();}
 };
}
