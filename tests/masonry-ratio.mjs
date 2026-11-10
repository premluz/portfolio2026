import assert from 'node:assert/strict';
import {masonryPlan,masonryRows,ratioCardHeight} from '../dist/placement.js';
import {homeProjects} from '../dist/documents.js';

const GAP=28,ROW=8;
const flat=plan=>plan.map(pose=>[pose.id,pose.column,pose.columnSpan,pose.row,pose.rowSpan,pose.height]);

// Setting off: the planner must give exactly the plans it gave before ratio sizing existed (captured from the previous planner).
const GOLDEN={
 featured:{"1":[["galachain",1,1,1,54,400],["bastion",1,1,55,59,437],["tracr",1,1,114,63,474],["merlin",1,1,177,54,400],["vodafone-iot",1,1,231,59,437],["gala-defi",1,1,290,63,474],["rios",1,1,353,66,500],["playstation",1,1,419,59,437]],"2":[["galachain",1,1,1,54,400],["bastion",1,1,55,59,437],["tracr",1,1,114,63,474],["merlin",1,1,177,54,400],["vodafone-iot",1,1,231,59,437],["gala-defi",1,1,290,63,474],["rios",2,1,1,66,500],["playstation",1,1,353,59,437]],"3":[["galachain",1,1,1,54,404],["bastion",1,2,55,108,836],["tracr",1,2,163,108,836],["merlin",1,2,271,108,836],["vodafone-iot",1,2,379,108,836],["gala-defi",1,2,487,108,836],["rios",3,1,1,108,836],["playstation",1,2,595,108,836]],"4":[["galachain",1,1,1,54,404],["bastion",1,2,55,108,836],["tracr",1,2,163,108,836],["merlin",1,2,271,108,836],["vodafone-iot",1,2,379,108,836],["gala-defi",1,2,487,108,836],["rios",3,1,1,108,836],["playstation",1,2,595,108,836]]},
 plain:{"1":[["galachain",1,1,1,54,400],["bastion",1,1,55,59,437],["tracr",1,1,114,63,474],["merlin",1,1,177,54,400],["vodafone-iot",1,1,231,59,437],["gala-defi",1,1,290,63,474],["rios",1,1,353,66,500],["playstation",1,1,419,59,437]],"2":[["galachain",1,1,1,54,400],["bastion",2,1,1,59,437],["tracr",1,1,55,63,474],["merlin",2,1,60,54,400],["vodafone-iot",2,1,114,59,437],["gala-defi",1,1,118,63,474],["rios",2,1,173,66,500],["playstation",1,1,181,59,437]],"3":[["galachain",1,1,1,54,404],["bastion",2,1,1,54,404],["tracr",3,1,1,54,404],["merlin",1,1,55,54,404],["vodafone-iot",2,1,55,54,404],["gala-defi",3,1,55,54,404],["rios",3,1,109,108,836],["playstation",1,1,109,54,404]],"4":[["galachain",1,1,1,54,404],["bastion",2,1,1,54,404],["tracr",4,1,1,54,404],["merlin",1,1,55,54,404],["vodafone-iot",2,1,55,54,404],["gala-defi",4,1,55,54,404],["rios",3,1,1,108,836],["playstation",1,1,109,54,404]]}
};
for(const [name,items] of [['featured',homeProjects],['plain',homeProjects.map(project=>({...project,featured:false}))]])
 for(const columns of [1,2,3,4]){
  const heights=columns<=2?Object.fromEntries(items.map((project,index)=>[project.id,400+(index%3)*37+(project.cardAspect==='portrait'?100:0)])):null;
  assert.deepEqual(flat(masonryPlan(items,columns,400,GAP,ROW,heights)),GOLDEN[name][columns],`Setting off: ${name} plan at ${columns} columns is unchanged`);
  assert.deepEqual(flat(masonryPlan(items,columns,400,GAP,ROW,heights,{byRatio:false})),GOLDEN[name][columns],'An explicit byRatio:false is the same as omitting it');
 }

// The sizing rule.
const rule={width:400,sides:40,ends:40,copyHeight:60,margin:20,maxImageHeight:600};
const tall=ratioCardHeight({...rule,ratio:.46});
assert.equal(tall.imageHeight,600,'A 0.46 image is capped by the maximum image height');
assert(Math.abs(tall.imageWidth-600*.46)<1e-9,'and its width follows from the capped height');
assert.equal(tall.cardHeight,40+60+20+600);
const wide=ratioCardHeight({...rule,ratio:2.33});
assert(Math.abs(wide.imageHeight-360/2.33)<1e-9&&wide.imageWidth===360,'A wide image fills the column and is not capped');
assert.deepEqual(ratioCardHeight({...rule,ratio:null}),{imageWidth:0,imageHeight:0,cardHeight:100},'No media: just padding and copy');
assert.equal(ratioCardHeight({...rule,ratio:1.6,maxImageWidth:200}).imageWidth,200,'The maximum image width applies too');
assert.equal(ratioCardHeight({...rule,ratio:1,bleed:true,copyHeight:900}).cardHeight,940,'Bleed: the taller of copy and image sets the card');

// Planner on ratios the current content does not have, at 2, 3 and 4 columns, with one featured and one text-only item.
const columnWidth=400,sample=[['r046',.46],['r075',.75],['r100',1],['r160',1.6],['r233',2.33],['text',null],['lead',1.6]].map(([id,ratio])=>({id,ratio,featured:id==='lead'}));
for(const columns of [2,3,4]){
 const items=sample.map(item=>({id:item.id,featured:item.featured}));
 const heights=Object.fromEntries(sample.map(item=>[item.id,ratioCardHeight({...rule,width:columnWidth*(item.featured&&columns>=3?2:1)+(item.featured&&columns>=3?GAP:0),ratio:item.ratio}).cardHeight]));
 const plan=masonryPlan(items,columns,1,GAP,ROW,heights,{byRatio:true}),taken=new Set();
 for(const pose of plan){
  assert(pose.column>=1&&pose.column+pose.columnSpan-1<=columns,`${pose.id} stays inside ${columns} columns`);
  assert.equal(pose.rowSpan,masonryRows(heights[pose.id],GAP,ROW),`${pose.id} spans the rows its ratio-derived height needs`);
  assert.equal(pose.height,heights[pose.id]);
  for(let dy=0;dy<pose.rowSpan;dy++)for(let dx=0;dx<pose.columnSpan;dx++){const cell=`${pose.row+dy}/${pose.column+dx}`;assert(!taken.has(cell),`${pose.id} overlaps another card at ${cell} (${columns} columns)`);taken.add(cell);}
 }
 if(columns>=3)assert.equal(plan.find(pose=>pose.id==='lead').column,1,'Featured cards still lead on the left');
 assert(plan.find(pose=>pose.id==='text').rowSpan<plan.find(pose=>pose.id==='r100').rowSpan,'A text-only card is the shortest');
}

// Tallness is relative: a card of at least 1.5 times the median row span goes right. The current content (one phone among landscapes) shows it.
for(const columns of [3,4]){
 const items=homeProjects.map(project=>({id:project.id,featured:false}));
 const heights=Object.fromEntries(homeProjects.map(project=>[project.id,ratioCardHeight({...rule,ratio:project.cardRatio}).cardHeight]));
 assert.equal(masonryPlan(items,columns,1,GAP,ROW,heights,{byRatio:true}).find(pose=>pose.id==='rios').column,columns===4?3:columns,`The phone-shaped card takes the right-hand tall slot at ${columns} columns (column 3 of 4, as portraits always have), chosen from its row span`);
}
const middling=[{id:'c'},{id:'a'},{id:'b'}];
assert.equal(masonryPlan(middling,3,1,GAP,ROW,{a:300,b:300,c:440},{byRatio:true}).find(pose=>pose.id==='c').column,1,'1.47 times the median is not tall, so it takes the first free column');
assert.equal(masonryPlan(middling,3,1,GAP,ROW,{a:300,b:300,c:500},{byRatio:true}).find(pose=>pose.id==='c').column,3,'Over 1.5 times the median is tall, so it goes right');

// Orientation is ignored in this mode: a "portrait" label on a wide image does not make the card tall.
const wideLabelledPortrait=[{id:'a',cardAspect:'portrait'},{id:'b'},{id:'c'}],uniform={a:300,b:300,c:300};
assert.deepEqual(masonryPlan(wideLabelledPortrait,4,1,GAP,ROW,uniform,{byRatio:true}).map(pose=>pose.column),[1,2,3],'No portrait special case');
assert.throws(()=>masonryPlan(wideLabelledPortrait,3,1,GAP,ROW,null,{byRatio:true}),/needs a height/,'byRatio without heights fails loudly');
assert.throws(()=>masonryPlan(wideLabelledPortrait,3,1,GAP,ROW,{a:1,b:1},{byRatio:true}),/no height for: c/,'and names the item that has none');
console.log('Masonry ratio passed: setting-off plans unchanged, ratio sizing rule with caps, no overlap or overflow at 2–4 columns, featured lead left, tallness from row span, loud failures.');
