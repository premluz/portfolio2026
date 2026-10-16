// Turns the dock's current layout (pills, popover, split pieces, back pill) into rounded shapes for
// the metaball outline. Geometry and timing still come from dock-morph.js; only the outline changes.

export const LIQUID_DEFAULTS=Object.freeze({blend:28,pinch:.6});
const EMERGE=.08;
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};

// Zero at rest on both ends, full mid-motion, then shrinking from `pinch` so the neck thins and snaps.
export function liquidBlend(phase,{blend,pinch}){
 return blend*smooth(0,EMERGE,phase)*(1-smooth(Math.min(.98,pinch),1,phase));
}
// A splitting pill starts fused and its blend shrinks as the pieces part, so it pinches instead of cutting.
export const splitBlend=(progress,{blend})=>progress>0?blend*(1-smooth(0,1,progress)):0;

const rect=(x,y,width,height,radius,blend=0)=>({x,y,width,height,radius:Math.min(radius,width/2,height/2),blend});

function branchShapes(branch,{radius=24,position=0,split=0},liquid){
 if(!branch||branch.height<=.5||branch.width<=.5)return [];
 const opening=liquidBlend(position,liquid),progress=clamp(split)*smooth(.94,1,position);
 if(!branch.segments?.length)return [rect(branch.left,branch.top,branch.width,branch.height,radius,opening)];
 const parting=Math.max(opening,splitBlend(progress,liquid));
 return branch.segments.map(segment=>rect(segment.left,segment.top??branch.top,segment.width,segment.height??branch.height,radius,parting));
}

/** The dock's pieces, main pill first; each later piece fuses into the union with its own blend. */
export function dockLiquidShapes({shape,phase,metrics,extension=null,receding=null,recedingSource=null,back=null,backPhase=0},liquid=LIQUID_DEFAULTS){
 const radius=metrics.radius||metrics.height/2,shapes=[rect(shape.mainLeft,0,shape.mainWidth,shape.height,radius)];
 if(shape.contextWidth>.001&&shape.contextHeight>.001)shapes.push(rect(0,(shape.height-shape.contextHeight)/2,shape.contextWidth,shape.contextHeight,radius,liquidBlend(phase,liquid)));
 if(extension)shapes.push(...branchShapes(shape.popover,extension,liquid));
 if(receding&&recedingSource)shapes.push(...branchShapes(receding.popover,recedingSource,liquid));
 if(back)shapes.push(rect(back.left,back.top,back.width,back.height,radius,liquidBlend(backPhase,liquid)));
 return shapes;
}
