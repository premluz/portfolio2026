// Layouts provide screen geometry and a local pose. Perspective cards are
// brought face-on by their adapter before the shared 2D liquid morph begins.
export function capturePlacement(element){
 const carrier=element.closest('.card-placement')||element;
 return {id:element.dataset.card||null,screenRect:element.getBoundingClientRect(),localSize:{width:element.offsetWidth,height:element.offsetHeight},transform:getComputedStyle(carrier).transform,space:element.closest('.home-view-flip')?'css-3d':'screen'};
}
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function flipPose(offset,reduced=false){
 const distance=Math.abs(offset),outside=Math.max(0,distance-.18);
 return {angle:reduced?0:clamp(Math.sign(offset)*outside*88,-76,76),scale:reduced?1:1-Math.min(.24,outside*.24),opacity:1-Math.min(.82,outside*.64)};
}
export function masonryRows(height,gap=28,row=8){return Math.max(1,Math.ceil((height+gap)/row));}
// One short card plus its gap is a module. Tall cards occupy two modules,
// keeping their bottom edge exactly level with two stacked short cards.
export function masonryMinimumHeight({width,ratio=1.6,padding={},copyHeight=0,margin=0,bleed=false,imagePadding={},visualSideExpansion=0}){
 const sides=(padding.left||0)+(padding.right||0),ends=(padding.top||0)+(padding.bottom||0);
 if(bleed)return Math.max(ends+copyHeight,Math.max(1,width-(imagePadding.left||0)-(imagePadding.right||0))/ratio+(imagePadding.top||0)+(imagePadding.bottom||0));
 return ends+copyHeight+margin+Math.max(1,width-sides+2*visualSideExpansion)/ratio;
}
export function masonryPlan(items,columns,minimumHeight,gap=28,row=8,heights=null){
 columns=clamp(Math.floor(columns)||1,1,4);
 const unitRows=masonryRows(minimumHeight,gap,row),occupied=[],poses=new Map(),portraitEnds=[0,0,0,0];
 function place(item,columnsToTry,floors=null){
  const columnSpan=item.featured===true&&columns>=3?2:1;
  const units=item.cardAspect==='portrait'||columnSpan===2?2:1;
  const height=heights?.[item.id]??units*unitRows*row-gap,rowSpan=heights?masonryRows(height,gap,row):units*unitRows;
  let y=0,x=0,found=false;
  // Fill the earliest available footprint, including gaps below wide cards.
  for(;!found;y++)for(const candidate of columnsToTry){x=candidate;
   if(floors&&y<(floors[candidate]||0))continue;
   let blocked=false;
   for(let dy=0;dy<rowSpan;dy++)for(let dx=0;dx<columnSpan;dx++)if(occupied[y+dy]?.[x+dx])blocked=true;
   if(blocked)continue;
   found=true;break;
  }
  y--;
  for(let dy=0;dy<rowSpan;dy++){occupied[y+dy]??=[];for(let dx=0;dx<columnSpan;dx++)occupied[y+dy][x+dx]=true;}
  const pose={id:item.id,column:x+1,columnSpan,row:y+1,rowSpan,height};poses.set(item,pose);return pose;
 }
 // Reserve the complete portrait stacks first so packing a landscape cannot
 // push a later portrait out of its right-hand column. DOM order stays intact.
 if(columns===4)for(const item of items)if(item.cardAspect==='portrait'&&item.featured!==true){
  const pose=place(item,[2,3]);portraitEnds[pose.column-1]=pose.row-1+pose.rowSpan;
 }
 for(const item of items){
  if(poses.has(item))continue;
  const columnSpan=item.featured===true&&columns>=3?2:1;
  const preferred=item.featured===true?[0]:item.cardAspect==='portrait'?[columns-1]:null;
  const columnsToTry=preferred??Array.from({length:columns-columnSpan+1},(_,column)=>column);
  // Small landscapes prefer the left tracks, but can use free space below
  // the right-side portraits instead of creating an isolated last row.
  place(item,columnsToTry,columns===4&&item.cardAspect!=='portrait'?portraitEnds:null);
 }
 return items.map(item=>poses.get(item));
}
// Push along the existing spatial direction, only until the card clears the
// screen. Extra screen-width travel made close neighbours vanish too early.
export function neighborPush(rect,selected,viewport,clearance=24){
 const dx=rect.left+rect.width/2-selected.left-selected.width/2;
 const dy=rect.top+rect.height/2-selected.top-selected.height/2;
 if(Math.abs(dx)>Math.abs(dy)*.45)return {x:dx>=0?Math.max(0,viewport.width+clearance-rect.left):Math.min(0,-rect.left-rect.width-clearance),y:0};
 return {x:0,y:dy>=0?Math.max(0,viewport.height+clearance-rect.top):Math.min(0,-rect.top-rect.height-clearance)};
}
