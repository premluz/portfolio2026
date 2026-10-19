import assert from 'node:assert/strict';
import {SPIRAL_DEFAULTS,sectionProgress,spiralPhases,spiralSlot,spiralPose,gridPose,gridColumns,cardMorph,blendPose,introState,revealAlpha} from '../dist/card-spiral-layout.js';
import {coverScale} from '../dist/card-spiral-shader.js';
import {spiralItems} from '../dist/about-lab.js';
import {content} from '../dist/content/local.js';

const viewport={width:1440,height:900},count=36;
// Scroll progress through the pinned section.
assert.equal(sectionProgress({top:0,height:3780},900),0);assert.equal(sectionProgress({top:-2880,height:3780},900),1);assert.equal(sectionProgress({top:200,height:3780},900),0,'Before the section it is the spiral');

// Phases: the spiral speeds up as you scroll, then unwinds into the grid, then the grid is browsed.
const at=p=>spiralPhases(p);
assert(at(.15).scrub>at(0).scrub,'Scrolling advances the cards along their tracks');assert.equal(at(.15).speed,at(0).speed,'Scroll never spins the scene faster');assert.equal(at(.9).scrub,at(.6).scrub,'The scrub stops once the grid takes over');assert.equal(at(0).morph,0);assert.equal(at(.7).morph,1);
assert.equal(at(.55).browse,0);assert.equal(at(1).browse,1);

// Slots spread round-robin over six arms.
const arms=new Set(Array.from({length:count},(_,i)=>spiralSlot(i,count).arm));assert.equal(arms.size,SPIRAL_DEFAULTS.arms);

// Spiral: cards grow and move outward along the arm; ends fade so wrapping never pops.
const slot={arm:0,base:0};
const near=spiralPose({...slot,base:.1},0,0,viewport),far=spiralPose({...slot,base:.8},0,0,viewport);
assert(Math.hypot(far.x,far.y)>Math.hypot(near.x,near.y)&&far.scale>near.scale,'Further along the arm is further out and larger');
assert(near.scale>=.3,'Cards near the centre are medium, not specks');
for(const base of [0,.2,.4,.6,.8])assert.equal(spiralPose({...slot,base},0,Math.PI/3,viewport).rotation,0,'Cards are always upright, at 0 degrees');
assert.equal(spiralPose({...slot,base:0},0,0,viewport).scale,0,'Born at zero size at the centre');assert.equal(spiralPose({...slot,base:.05},0,0,viewport).alpha,1,'Never a translucent ghost while it grows in');assert(spiralPose({...slot,base:.9999},0,0,viewport).alpha<.01,'Leaves invisible at the edge');
const turned=spiralPose(slot,0,Math.PI/2,viewport),flat=spiralPose(slot,0,0,viewport);assert(Math.abs(Math.hypot(turned.x,turned.y)-Math.hypot(flat.x,flat.y))<1e-6,'Spin rotates without changing radius');

// Intro: a speed burst that settles to idle, and a reveal wave from the centre outward.
assert.equal(introState(0).speedFactor,SPIRAL_DEFAULTS.introBurst);assert.equal(introState(SPIRAL_DEFAULTS.introSeconds).speedFactor,1);
assert(revealAlpha(.1,.3)>revealAlpha(.8,.3),'Inner cards appear before outer ones');assert.equal(revealAlpha(.9,5),1,'After the wave every card is revealed');

// Grid: centred columns on a plane tilted back, so rows further down sit deeper.
const columns=gridColumns(viewport);assert(columns>=4&&columns*SPIRAL_DEFAULTS.gridCardWidth<viewport.width,'Columns fit the viewport');
const first=gridPose(0,count,viewport,0,187),last=gridPose(count-1,count,viewport,0,187);
assert(first.y>last.y&&first.z<0!==last.z<0,'Rows run top to bottom across the tilted plane');
assert(Math.abs(gridPose(0,count,viewport,0,187).x+gridPose(columns-1,count,viewport,0,187).x)<1e-6,'Columns are centred');
assert.equal(gridColumns({width:375,height:812}),SPIRAL_DEFAULTS.columnsMin,'Phones keep two columns');

// Morph: staggered from the first card to the last, blending by the shortest turn.
assert(cardMorph(.3,0,count)>cardMorph(.3,count-1,count),'Earlier cards settle first');assert.equal(cardMorph(1,count-1,count),1);
const mid=blendPose({x:0,y:0,z:0,rotation:Math.PI*1.9,scale:1,alpha:1,depth:0},{x:10,y:0,z:0,rotation:0,scale:1,alpha:1,depth:0},.5);
assert(Math.abs(mid.rotation-Math.PI*1.95)<1e-9,'Rotation takes the short way round');

// Cover fit crops the image instead of stretching it.
assert.deepEqual(coverScale(2,1),[1,.5]);assert.deepEqual(coverScale(1,2),[.5,1]);

// Content: every project with an image opens its project; About photos are images only.
const items=spiralItems(content),projects=content.list({type:'portfolio-item'}).filter(doc=>content.getCard(doc.id)?.image);
assert.equal(items.filter(item=>item.projectId).length,projects.length,'Every project cover is a card');
assert(items.some(item=>!item.projectId),'About photos join the field');assert(items.every(item=>item.src),'Every card has an image');
console.log(`Card spiral layout passed: scroll phases, six arms, growth and fades, tilted centred grid, staggered morph, cover fit, ${items.length} cards of content.`);
