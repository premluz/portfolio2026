function wrappedSegments(branch,popover,draw,progress){
 const scaleX=branch.width/popover.width,scaleY=branch.height/popover.height;
 branch.segments=popover.splitRects.map(rect=>({
  left:branch.left+rect.left*scaleX*progress,
  top:branch.top+rect.top*scaleY*progress,
  width:branch.width+(rect.width*scaleX-branch.width)*progress,
  height:branch.height+(rect.height*scaleY-branch.height)*progress
 }));
 branch.path=branch.segments.map(rect=>{
  const radius=Math.min(popover.radius,rect.width/2,rect.height/2);
  return draw(rect.left,rect.top,rect.width,rect.height,radius,radius);
 }).join(' ');
}

export function splitPopover(branch,popover,draw,progress){
 const gap=Math.min(12,branch.width*.18)*progress;
 if(branch.connected||gap<.001||!branch.path)return;
 if(popover.splitRects?.length){wrappedSegments(branch,popover,draw,progress);return;}
 const radius=Math.min(popover.radius||24,branch.height/2),inner=radius*progress;
 const fractions=popover.splitAts?.length?popover.splitAts:[popover.splitAt||.5],cuts=[];
 for(const [index,fraction] of fractions.entries()){
  const cut=branch.left+branch.width*Math.max(.05,Math.min(.95,fraction)),seam=popover.splitGaps?Math.max(gap,popover.splitGaps[index]*progress):gap;
  if(!cuts.length||cut-cuts.at(-1).position>(seam+cuts.at(-1).gap)/2+2)cuts.push({position:cut,gap:seam});
 }
 branch.segments=Array.from({length:cuts.length+1},(_,index)=>{
  const left=index?cuts[index-1].position+cuts[index-1].gap/2:branch.left,right=index<cuts.length?cuts[index].position-cuts[index].gap/2:branch.left+branch.width;
  return {left,width:right-left};
 }).filter(segment=>segment.width>0);
 branch.segmentGap=gap;
 branch.path=branch.segments.map((segment,index)=>draw(segment.left,branch.top,segment.width,branch.height,index?inner:radius,index===branch.segments.length-1?radius:inner)).join(' ');
}
