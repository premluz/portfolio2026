import assert from 'node:assert/strict';
import {masonryPlan,masonryMinimumHeight} from '../dist/placement.js';
import {homeProjects as projects} from '../dist/documents.js';

function verify(items,columns,height,gap){
 const naturalHeights=Object.fromEntries(items.map((item,index)=>[item.id,item.naturalHeight??height+(item.cardAspect==='portrait'?72:index%2?18:0)]));
 const plan=masonryPlan(items,columns,height,gap,8,columns<=2?naturalHeights:null),short=masonryPlan([{id:'short'}],columns,height,gap)[0],cells=new Set();
 for(const [i,pose] of plan.entries()){
  const tall=items[i].cardAspect==='portrait'||items[i].featured===true&&columns>=3;
  assert(pose.column>=1&&pose.column+pose.columnSpan-1<=columns);
  assert.equal(pose.columnSpan,items[i].featured===true&&columns>=3?2:1);
  // A featured portrait card is two columns wide and leads on the left like every featured card, so the right-hand rule is for the others.
  if(columns>1&&items[i].cardAspect==='portrait'&&items[i].featured!==true)assert(columns>=4?pose.column>=columns-1:pose.column===columns,'Mobile-format cards belong in the right-side columns');
  if(columns===4&&items[i].cardAspect!=='portrait'&&pose.column>=3){
   const portraitEnd=Math.max(1,...plan.filter((p,j)=>items[j].cardAspect==='portrait'&&p.column===pose.column).map(p=>p.row+p.rowSpan));
   assert(pose.row>=portraitEnd,'Landscapes can fill the right tracks only below their portrait stacks');
  }
  if(items[i].featured===true)assert.equal(pose.column,1,'Featured cards are anchored at the left edge');
  if(columns===1||columns===2)assert.equal(pose.height,naturalHeights[items[i].id],'One and two column layouts keep each card’s natural height');
  else assert.equal(pose.height,tall?2*short.height+gap:short.height,'Three and four column layouts keep the shared height rhythm');
  for(let y=pose.row;y<pose.row+pose.rowSpan;y++)for(let x=pose.column;x<pose.column+pose.columnSpan;x++){
   const key=`${x},${y}`;assert(!cells.has(key),'Card footprints must never overlap');cells.add(key);
  }
 }
 return plan;
}
for(const columns of [1,2,3,4])for(const gap of [0,18,28,37.5,56])for(const height of [160,312.8,650]){
 verify(projects,columns,height,gap);
 for(let order=0;order<projects.length;order++)verify([...projects.slice(order),...projects.slice(0,order)],columns,height,gap);
}
const packed=verify([{id:'feature',featured:true},{id:'upper'},{id:'second-feature',featured:true},{id:'lower'}],3,300,28);
assert.equal(packed[0].row,packed[1].row);
assert.equal(packed[0].column,1);assert.equal(packed[1].column,3);assert.equal(packed[3].column,3);
assert.equal(packed[3].row,packed[1].row+packed[1].rowSpan,'Later short cards should fill the space beside the featured card');
assert.equal(packed[0].row+packed[0].rowSpan,packed[3].row+packed[3].rowSpan);
const mobilePair=verify([{id:'phone-a',cardAspect:'portrait'},{id:'phone-b',cardAspect:'portrait'}],4,300,28);
assert.deepEqual(mobilePair.map(pose=>pose.column),[3,4],'Four columns reserve both right-side tracks for mobile-format cards');
const leftRight=verify([{id:'featured',featured:true},{id:'phone-a',cardAspect:'portrait'},{id:'phone-b',cardAspect:'portrait'}],4,300,28);
assert.equal(leftRight[0].column,1);assert.deepEqual(leftRight.slice(1).map(pose=>pose.column),[3,4]);
const mixed=verify([{id:'featured',featured:true},{id:'phone-a',cardAspect:'portrait'},{id:'small-landscape',cardAspect:'landscape'},{id:'phone-b',cardAspect:'portrait'},{id:'another-landscape',cardAspect:'landscape'}],4,300,28);
assert.deepEqual(mixed.filter(pose=>pose.id.startsWith('phone')).map(pose=>pose.column),[3,4]);
assert(mixed.filter(pose=>pose.id.includes('landscape')).every(pose=>pose.column<=2),'Small landscapes must stack in the left half even when the right half has room');
// The real collection must never strand a short card below the featured column (it used to add a row).
const collection=verify(projects,4,300,28),ends=collection.map(pose=>pose.row+pose.rowSpan),featuredEnd=Math.max(...collection.filter((pose,index)=>projects[index].featured).map(pose=>pose.row+pose.rowSpan));
assert.equal(Math.max(...ends),featuredEnd,'No card finishes below the featured cards, so packing adds no extra row');
assert.deepEqual(collection.map(p=>p.id),projects.map(p=>p.id),'Packing preserves document and keyboard order');
const trailingPortrait=verify([{id:'feature-a',featured:true},{id:'feature-b',featured:true},{id:'short-landscape'},{id:'phone',cardAspect:'portrait'}],4,300,28);
assert.equal(trailingPortrait[3].row,1,'A later portrait reserves its position before landscape overflow is packed');
assert.equal(trailingPortrait[2].column,4,'Landscape overflow can use an empty right track without displacing the later portrait');
assert.deepEqual(masonryPlan([],4,300,28),[]);
const pair=masonryPlan([{id:'landscape'},{id:'portrait',cardAspect:'portrait'}],2,400,28,8,{landscape:340,portrait:476});
assert.equal(pair[0].height,340);assert.equal(pair[1].height,476,'Two columns must not force the portrait into the two-card height rhythm');

const padding={top:42,right:42,bottom:28,left:42};
assert.equal(masonryMinimumHeight({width:400,padding,copyHeight:96,margin:28}),70+96+28+316/1.6);
assert.equal(masonryMinimumHeight({width:400,padding,copyHeight:96,margin:28,visualSideExpansion:24}),70+96+28+(316+48)/1.6,'Landscape media reserves only the extra side width');
assert.equal(masonryMinimumHeight({width:400,padding}),70+316/1.6,'Hidden titles remove their space from the unit');
assert.equal(masonryMinimumHeight({width:400,padding,copyHeight:96,bleed:true,imagePadding:{top:128,left:24,right:24,bottom:24}}),352/1.6+152);
assert.equal(masonryMinimumHeight({width:400,padding,copyHeight:200,bleed:true}),270,'Visible headings must still have room with full-bleed images');
console.log('Masonry passed: featured spans, responsive columns, dense non-overlapping placement, exact height rhythm with fractional gaps, title space, and full-bleed padding.');
