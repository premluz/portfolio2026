// Turns the dock's current layout (pills, popover, split pieces, back pill) into rounded shapes for
// the metaball outline. Geometry and timing still come from dock-morph.js; only the outline changes.

export const LIQUID_DEFAULTS=Object.freeze({blend:28,pinch:.6});
// A piece blends at most this many times its smallest side, so a sliver rises as a rounded dome and
// shrinks smoothly to nothing instead of showing as a flat-topped lip.
const SIZE_BLEND_RATIO=2.5;
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};

// Full while a piece emerges, then shrinking from `pinch` so the neck thins and snaps before it settles.
export function liquidBlend(phase,{blend,pinch}){
 return blend*(1-smooth(Math.min(.98,pinch),1,phase));
}
const moving=phase=>phase>0&&phase<1;
// A splitting pill starts fused and its blend shrinks as the pieces part, so it pinches instead of cutting.
export const splitBlend=(progress,{blend})=>progress>0?blend*(1-smooth(0,1,progress)):0;

// `grown` is how far the piece is towards its full height: below DOME_UNTIL it is round like a drop.
const DOME_FROM=.35,DOME_UNTIL=.9;
const rect=(x,y,width,height,radius,blend=0,inMotion=false,grown=1)=>({x,y,width,height,radius:Math.min(radius,width/2,height/2),blend:Math.min(blend,SIZE_BLEND_RATIO*Math.min(width,height)),moving:inMotion,dome:inMotion?1-smooth(DOME_FROM,DOME_UNTIL,grown):0});
// Split pieces pinch apart from each other only; the group joins the bar with the normal opening blend,
// so parting never fuses the pieces back onto the composer.
function group(parts,partsBlend,blend,inMotion){
 const left=Math.min(...parts.map(part=>part.x)),top=Math.min(...parts.map(part=>part.y));
 const width=Math.max(...parts.map(part=>part.x+part.width))-left,height=Math.max(...parts.map(part=>part.y+part.height))-top;
 return {x:left,y:top,width,height,parts,partsBlend,blend:Math.min(blend,SIZE_BLEND_RATIO*Math.min(...parts.map(part=>Math.min(part.width,part.height)))),moving:inMotion};
}

// Each split piece is a full pill, so two pieces meeting leave a waist the blend cannot fill. A flat bridge
// between neighbours on the same row fills it as they close (full height once nearly closed), so a
// re-joining pill is one smooth pill long before the split settles, and an opening one pinches apart.
const BRIDGE_UNTIL=.6;
function seamBridges(parts,progress){
 const height=1-smooth(0,BRIDGE_UNTIL,progress);if(height<=0)return [];
 return parts.slice(1).flatMap((part,index)=>{
  const previous=parts[index];if(Math.abs(part.y-previous.y)>.5)return [];
  const left=previous.x+previous.width/2,right=part.x+part.width/2,full=Math.min(previous.height,part.height),bridge=full*height;
  return right>left?[rect(left,previous.y+(full-bridge)/2,right-left,bridge,0)]:[];
 });
}

function branchShapes(branch,{radius=24,position=0,split=0,height:fullHeight=branch?.height},liquid){
 if(!branch||branch.height<=.5||branch.width<=.5)return [];
 const opening=liquidBlend(position,liquid),progress=clamp(split)*smooth(.94,1,position),inMotion=moving(position);
 const grown=fullHeight?branch.height/fullHeight:1;
 if(!branch.segments?.length)return [rect(branch.left,branch.top,branch.width,branch.height,radius,opening,inMotion,grown)];
 const parts=branch.segments.map(segment=>rect(segment.left,segment.top??branch.top,segment.width,segment.height??branch.height,radius));
 // The pieces' blend fades as the bridge takes over, so the closing union is a plain pill, not a lumpy one.
 return [group([...parts,...seamBridges(parts,progress)],splitBlend(progress,liquid)*smooth(0,BRIDGE_UNTIL,progress),opening,inMotion||progress>0&&progress<1)];
}

/** The dock's pieces, main pill first; each later piece fuses into the union with its own blend. */
export function dockLiquidShapes({shape,phase,metrics,extension=null,receding=null,recedingSource=null,back=null,backPhase=0},liquid=LIQUID_DEFAULTS){
 const radius=metrics.radius||metrics.height/2,shapes=[rect(shape.mainLeft,0,shape.mainWidth,shape.height,radius)];
 if(shape.contextWidth>.001&&shape.contextHeight>.001)shapes.push(rect(0,(shape.height-shape.contextHeight)/2,shape.contextWidth,shape.contextHeight,radius,liquidBlend(phase,liquid),moving(phase),shape.contextHeight/shape.height));
 if(extension)shapes.push(...branchShapes(shape.popover,extension,liquid));
 if(receding&&recedingSource)shapes.push(...branchShapes(receding.popover,recedingSource,liquid));
 if(back)shapes.push(rect(back.left,back.top,back.width,back.height,radius,liquidBlend(backPhase,liquid),moving(backPhase),Math.min(back.width,back.height)/metrics.height));
 return shapes;
}
