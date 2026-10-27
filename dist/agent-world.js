// What the agent knows about the screen: where home is, where the pointer is, and which spots near a target
// are free. The seat maths are pure; createAgentWorld binds them to the live document.
const CONTENT='p,h1,h2,h3,h4,h5,h6,li,dt,dd,blockquote,figcaption,img,video,canvas,button,a,input,textarea,label,svg,.glass-surface';

export const boxAround=(point,size)=>({left:point.x-size/2,top:point.y-size/2,right:point.x+size/2,bottom:point.y+size/2});
export function overlapArea(a,b){
 const width=Math.min(a.right,b.right)-Math.max(a.left,b.left),height=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
 return width>0&&height>0?width*height:0;
}
// Home sits just right of the composer or Assistant button; with no room there, above its right end.
// `preferLeft` (nav on top) keeps the menu the rightmost container: the character hangs off its left side first.
export function homeSeat(anchor,viewport,size,gap,{preferLeft=false}={}){
 const half=size/2,right={x:anchor.right+gap+half,y:(anchor.top+anchor.bottom)/2},left={x:anchor.left-gap-half,y:right.y};
 if(preferLeft&&left.x-half>=gap)return left;
 if(right.x+half<=viewport.width-gap)return right;
 if(left.x-half>=gap)return left;
 return {x:Math.max(gap+half,anchor.right-half),y:Math.max(gap+half,anchor.top-gap-half)};
}
// Spots beside, above and below every box that matters (the target, its popover, its paragraph).
export function seatCandidates(boxes,size,gap){
 const half=size/2,offset=half+gap;
 return boxes.flatMap(box=>{const middle=(box.top+box.bottom)/2;return [
  {x:box.right+offset,y:middle},{x:box.left-offset,y:middle},
  {x:box.right+offset,y:box.top+half},{x:box.left-offset,y:box.top+half},
  {x:box.right-half,y:box.top-offset},{x:box.left+half,y:box.top-offset},
  {x:box.right-half,y:box.bottom+offset},{x:box.left+half,y:box.bottom+offset}
 ];});
}
// The free spot closest to the target. Covering a known box costs its overlap; each probe hit (content or the
// visitor's pointer under the spot) costs a whole body. Nothing free on screen: the least-covered spot wins.
export function chooseSeat({target,obstacles=[],viewport,size,gap,probe=()=>0}){
 const boxes=[target,...obstacles],centre={x:(target.left+target.right)/2,y:(target.top+target.bottom)/2},half=size/2;
 const fits=point=>point.x-half>=gap&&point.x+half<=viewport.width-gap&&point.y-half>=gap&&point.y+half<=viewport.height-gap;
 let best=null;
 for(const point of seatCandidates(boxes,size,gap)){
  if(!fits(point))continue;
  const box=boxAround(point,size),covered=boxes.reduce((sum,other)=>sum+overlapArea(box,other),0);
  const score=covered+probe(box)*size*size+Math.hypot(point.x-centre.x,point.y-centre.y);
  if(!best||score<best.score)best={x:point.x,y:point.y,score};
 }
 if(best)return {x:best.x,y:best.y};
 return {x:Math.min(viewport.width-gap-half,Math.max(gap+half,target.right+gap+half)),y:Math.min(viewport.height-gap-half,Math.max(gap+half,centre.y))};
}
const shown=node=>Boolean(node?.isConnected&&!node.hidden&&node.getClientRects().length&&(node.checkVisibility?.({opacityProperty:true,visibilityProperty:true})??true));
export function homeAnchor(doc){
 const composer=doc.getElementById('askForm'),launcher=doc.getElementById('assistantLauncher');
 return shown(composer)?composer:shown(launcher)?launcher:doc.getElementById('dock');
}
// Samples the spot's centre and corners for content, and adds the visitor's pointer as a hit.
export function probeContent(doc,box,pointer){
 const inset=(box.right-box.left)/4,points=[[box.left+inset,box.top+inset],[box.right-inset,box.top+inset],[box.left+inset,box.bottom-inset],[box.right-inset,box.bottom-inset],[(box.left+box.right)/2,(box.top+box.bottom)/2]];
 const hits=points.filter(([x,y])=>doc.elementFromPoint(x,y)?.closest(CONTENT)).length;
 const covered=pointer&&pointer.x>=box.left&&pointer.x<=box.right&&pointer.y>=box.top&&pointer.y<=box.bottom;
 return hits+(covered?2:0);
}
export function createAgentWorld({doc=document,win=window,gap}={}){
 let pointer=null;
 const move=event=>{if(event.pointerType!=='touch')pointer={x:event.clientX,y:event.clientY};};
 win.addEventListener('pointermove',move,{passive:true});
 const viewport=()=>({width:win.innerWidth,height:win.innerHeight});
 return {
  viewport,
  // On the menu-dock chat page the character's home is the stage above the welcome, centred in it.
  // Opacity is ignored here: the chat page fades in, and the stage is already where it will settle.
  home(size){const stage=doc.getElementById('assistantMascot');if(stage?.isConnected&&!stage.hidden&&stage.getClientRects().length){const box=stage.getBoundingClientRect();return {x:(box.left+box.right)/2,y:(box.top+box.bottom)/2};}const anchor=homeAnchor(doc);return anchor?homeSeat(anchor.getBoundingClientRect(),viewport(),size,gap,{preferLeft:doc.documentElement.dataset.navPosition==='top'}):{x:viewport().width-gap-size/2,y:viewport().height-gap-size/2};},
  seat(target,obstacles,size){return chooseSeat({target:target.getBoundingClientRect(),obstacles:obstacles.filter(shown).map(node=>node.getBoundingClientRect()),viewport:viewport(),size,gap,probe:box=>probeContent(doc,box,pointer)});},
  destroy(){win.removeEventListener('pointermove',move);}
 };
}
