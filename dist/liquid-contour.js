// Metaball outline for the liquid glass: each piece is a rounded rectangle, pieces blend through a
// smooth minimum, and one closed contour is traced where the blended field crosses zero. Merging,
// necking and pinching off all follow from that one rule, so there are no hand-built necks, cuts or
// overlapping sub-paths (whose edges would show as hairlines in the rim stroke).

const MIN_STEP=2,MAX_STEP=4,TARGET_CELLS=220;
export const LIQUID_BLEND_EPSILON=.5;

// Signed distance from a point to a rounded rectangle: negative inside, positive outside.
export function roundedRectDistance(px,py,{x,y,width,height,radius}){
 const hx=width/2,hy=height/2,r=Math.max(0,Math.min(radius,hx,hy));
 const qx=Math.abs(px-(x+hx))-hx+r,qy=Math.abs(py-(y+hy))-hy+r;
 return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}

// Polynomial smooth minimum: within `blend` pixels of each other two surfaces fuse with a fillet.
export function smoothMin(a,b,blend){
 if(blend<=LIQUID_BLEND_EPSILON)return Math.min(a,b);
 const h=Math.max(blend-Math.abs(a-b),0)/blend;
 return Math.min(a,b)-h*h*blend/4;
}

// Each shape joins the union with its own blend, so a settled piece stays crisp while a moving one flows.
export function liquidField(px,py,shapes){
 let value=roundedRectDistance(px,py,shapes[0]);
 for(let index=1;index<shapes.length;index++)value=smoothMin(value,roundedRectDistance(px,py,shapes[index]),shapes[index].blend||0);
 return value;
}

const usable=shape=>shape&&shape.width>.5&&shape.height>.5;
export const needsLiquid=shapes=>shapes.filter(usable).slice(1).some(shape=>(shape.blend||0)>LIQUID_BLEND_EPSILON);

function bounds(shapes){
 const reach=Math.max(0,...shapes.map(shape=>shape.blend||0))/4+MAX_STEP;
 const left=Math.min(...shapes.map(shape=>shape.x))-reach,top=Math.min(...shapes.map(shape=>shape.y))-reach;
 const right=Math.max(...shapes.map(shape=>shape.x+shape.width))+reach,bottom=Math.max(...shapes.map(shape=>shape.y+shape.height))+reach;
 return {left,top,width:right-left,height:bottom-top};
}

function sampleGrid(shapes,box){
 const step=Math.max(MIN_STEP,Math.min(MAX_STEP,Math.max(box.width,box.height)/TARGET_CELLS));
 const columns=Math.ceil(box.width/step)+1,rows=Math.ceil(box.height/step)+1,values=new Float32Array(columns*rows);
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++)values[row*columns+column]=liquidField(box.left+column*step,box.top+row*step,shapes);
 return {step,columns,rows,values};
}

// Marching squares; edges are keyed so neighbouring cells share exact points and loops close cleanly.
const CELL_SEGMENTS={1:[['L','B']],2:[['B','R']],3:[['L','R']],4:[['T','R']],6:[['T','B']],7:[['T','L']],8:[['L','T']],9:[['T','B']],11:[['T','R']],12:[['L','R']],13:[['R','B']],14:[['L','B']]};
function cellSegments(code,centreInside){
 if(code===5)return centreInside?[['L','T'],['B','R']]:[['T','R'],['L','B']];
 if(code===10)return centreInside?[['T','R'],['L','B']]:[['L','T'],['B','R']];
 return CELL_SEGMENTS[code]||[];
}

function traceSegments({step,columns,rows,values},box){
 const at=(column,row)=>values[row*columns+column],points=new Map(),links=new Map();
 const cross=(key,ax,ay,av,bx,by,bv)=>{if(!points.has(key)){const t=av/(av-bv);points.set(key,[box.left+(ax+(bx-ax)*t)*step,box.top+(ay+(by-ay)*t)*step]);}return key;};
 const link=(a,b)=>{for(const [from,to] of [[a,b],[b,a]]){if(!links.has(from))links.set(from,[]);links.get(from).push(to);}};
 for(let row=0;row<rows-1;row++)for(let column=0;column<columns-1;column++){
  const tl=at(column,row),tr=at(column+1,row),br=at(column+1,row+1),bl=at(column,row+1);
  const code=(tl<0?8:0)|(tr<0?4:0)|(br<0?2:0)|(bl<0?1:0);if(!code||code===15)continue;
  const edge={T:()=>cross(`h${column},${row}`,column,row,tl,column+1,row,tr),R:()=>cross(`v${column+1},${row}`,column+1,row,tr,column+1,row+1,br),B:()=>cross(`h${column},${row+1}`,column,row+1,bl,column+1,row+1,br),L:()=>cross(`v${column},${row}`,column,row,tl,column,row+1,bl)};
  for(const [a,b] of cellSegments(code,(tl+tr+br+bl)/4<0))link(edge[a](),edge[b]());
 }
 return {points,links};
}

function chainLoops({points,links}){
 const loops=[],visited=new Set();
 for(const start of links.keys()){
  if(visited.has(start))continue;
  const loop=[];let previous=null,current=start;
  while(current&&!visited.has(current)){visited.add(current);loop.push(points.get(current));const next=(links.get(current)||[]).find(key=>key!==previous&&!visited.has(key));previous=current;current=next;}
  if(loop.length>2)loops.push(loop);
 }
 return loops;
}

const fixed=value=>Math.round(value*100)/100;
// Quadratic curves through the midpoints of the traced polygon: smooth, and exact to the sampled edge.
function smoothLoop(loop){
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],start=mid(loop.at(-1),loop[0]);
 let path=`M ${fixed(start[0])} ${fixed(start[1])}`;
 for(let index=0;index<loop.length;index++){const control=loop[index],end=mid(control,loop[(index+1)%loop.length]);path+=` Q ${fixed(control[0])} ${fixed(control[1])} ${fixed(end[0])} ${fixed(end[1])}`;}
 return path+' Z';
}

/** One closed outline (even-odd) for the blended shapes, or null when nothing is blending. */
export function liquidOutline(shapes){
 const pieces=shapes.filter(usable);
 if(!pieces.length||!needsLiquid(pieces))return null;
 const box=bounds(pieces),grid=sampleGrid(pieces,box);
 return chainLoops(traceSegments(grid,box)).map(smoothLoop).join(' ');
}
