import assert from 'node:assert/strict';
import {classifyHand,GestureIntent,gestureTuning} from '../dist/gesture-intent.js';

function hand(pose) {
  const p=Array.from({length:21},()=>({x:.5,y:.7,z:0}));p[0]={x:.5,y:.94,z:0};
  [p[1],p[2],p[3],p[4]]=[{x:.37,y:.81,z:0},{x:.39,y:.74,z:0},{x:.46,y:.69,z:0},{x:.52,y:.69,z:0}];
  for(const [number,start,x] of [[0,5,.43],[1,9,.50],[2,13,.58],[3,17,.66]]) {
    const extended=pose==='palm'||['pointer','lShape','pinch'].includes(pose)&&number<2;
    p[start]={x,y:.7,z:0};p[start+1]={x,y:.52,z:0};
    p[start+2]={x:extended?x:x-.035,y:extended?.39:.61,z:0};
    p[start+3]={x:extended?x:x-.055,y:extended?.27:.72,z:0};
  }
  if(pose==='palm')[p[2],p[3],p[4]]=[{x:.29,y:.70,z:0},{x:.23,y:.61,z:0},{x:.16,y:.50,z:0}];
  if(pose==='lShape')[p[2],p[3],p[4]]=[{x:.28,y:.72,z:0},{x:.17,y:.70,z:0},{x:.06,y:.68,z:0}];
  if(pose==='pinch')[p[2],p[3],p[4]]=[{x:.30,y:.63,z:0},{x:.37,y:.43,z:0},{x:.465,y:.28,z:0}];
  return p;
}
for(const pose of ['pointer','lShape','pinch','palm','fist']) {
  const landmarks=hand(pose);assert.equal(classifyHand(landmarks).pose,pose==='lShape'?'pointer':pose);
  for(const rotation of [Math.PI/2,-.7,Math.PI]) {
    const rotated=landmarks.map(p=>({x:.5+(p.x-.5)*Math.cos(rotation)-(p.y-.5)*Math.sin(rotation),y:.5+(p.x-.5)*Math.sin(rotation)+(p.y-.5)*Math.cos(rotation),z:0}));
    assert.equal(classifyHand(rotated).pose,pose==='lShape'?'pointer':pose,'Joint geometry survives hand rotation');
  }
  assert.equal(classifyHand(landmarks.map(p=>({x:1-p.x,y:p.y,z:p.z}))).pose,pose==='lShape'?'pointer':pose,'Either hand and mirroring are supported');
  assert.equal(classifyHand(landmarks.map(p=>({x:.5+(p.x-.5)*.4,y:.5+(p.y-.5)*.4,z:p.z*.4}))).pose,pose==='lShape'?'pointer':pose,'Thumb contact and extension scale with the hand');
}
const bentPinch=hand('pinch');bentPinch[8].y=bentPinch[12].y=bentPinch[4].y=.43;
assert.equal(classifyHand(bentPinch).pose,'pinch','Bent pointing fingers reaching the thumb remain a click pose');
assert(classifyHand(bentPinch).pinchDistance<gestureTuning.pinchEnter);
const oneFinger=hand('pinch');oneFinger[4].x=.39;
assert(classifyHand(oneFinger).pinchDistance>gestureTuning.pinchEnter,'Touching only one of the two fingertips cannot commit');
const near=hand('pinch');near[4].y=.39;
assert.equal(classifyHand(near).pose,'pinch','Approaching the fingertips freezes targeting before contact');
assert(classifyHand(near).pinchDistance>gestureTuning.pinchEnter);
const spread=hand('pointer');spread[12].x+=.2;assert.equal(classifyHand(spread).pose,'other','Separated fingers do not control the cursor');
const relaxedFist=hand('fist');for(const index of [1,2,3,4])relaxedFist[index]=hand('palm')[index];
assert.equal(classifyHand(relaxedFist).pose,'fist','A closed hand does not require tucking the thumb');
const relaxedPalm=hand('palm');for(const index of [1,2,3,4])relaxedPalm[index]=hand('fist')[index];
assert.equal(classifyHand(relaxedPalm).pose,'palm','A relaxed thumb does not prevent the Back pose');
for(const pose of ['palm','pointer','lShape','pinch','fist']) {
  const source=hand(pose),yaw=1.52;
  const world=source.map(p=>({x:(p.x-.5)*Math.cos(yaw)*.2,y:(p.y-.5)*.2,z:-(p.x-.5)*Math.sin(yaw)*.2}));
  const edgeOn=source.map(p=>({x:.5+(p.x-.5)*Math.cos(yaw)*.4,y:p.y,z:0}));
  assert.equal(classifyHand(edgeOn,world).pose,pose==='lShape'?'pointer':pose,'Metric joints identify an angled/edge-on hand without a front-facing palm');
}
assert.equal(classifyHand([]),null);assert.equal(classifyHand(hand('palm').map(p=>({...p,x:NaN}))),null);

const sample=(pose,x=.5,y=.5,pinchDistance=.15)=>({pose,point:{x,y},swipePoint:{x,y},pinchDistance,palmTilt:0});
const click=new GestureIntent();click.update(sample('pointer'),0);assert.equal(click.update(sample('pointer'),140).cursor.x,.5);
click.update(sample('other'),180);click.update(sample('pinch'),220);
assert.equal(click.update(sample('pinch'),350).command.id,'pointer.activate');
const closing=new GestureIntent();closing.update(sample('pointer',.25,.3),0);closing.update(sample('pointer',.25,.3),140);
closing.update(sample('pinch',.8,.9,.65),180);const held=closing.update(sample('pinch',.8,.9,.65),340);
assert.equal(held.cursorMode,'hold');assert.deepEqual(held.cursor,{x:.25,y:.3},'Thumb approach retains the pointed location before contact');
assert.equal(held.command,null,'Proximity alone cannot click');
closing.update(sample('pinch',.8,.9),400);assert.deepEqual(closing.update(sample('pinch',.8,.9),520).command.point,{x:.25,y:.3});
for(const time of [500,900,2000])assert.equal(click.update(sample('pinch'),time).command,null,'A held pinch clicks only once');
click.update(sample('palm'),2100);click.update(sample('palm'),2220);click.update(sample('fist'),2300);
assert.equal(click.update(sample('fist'),2420).command,null,'Opening/closing after a click only releases; it cannot trigger Back');
for(const pose of ['palm','fist']) {
  const oldTrigger=new GestureIntent();oldTrigger.update(sample('pointer'),0);oldTrigger.update(sample('pointer'),140);oldTrigger.update(sample(pose),220);
  assert.equal(oldTrigger.update(sample(pose),350).command,null,'Point→palm/fist no longer clicks');
}
const fist=new GestureIntent();fist.update(sample('fist'),0);assert.equal(fist.update(sample('fist'),200).command,null,'A lone fist is inert');
const lonePinch=new GestureIntent();lonePinch.update(sample('pinch'),0);assert.equal(lonePinch.update(sample('pinch'),150).command,null,'Pinching without pointing is inert');
const noise=new GestureIntent();noise.update(sample('pointer'),0);noise.update(sample('pointer'),140);noise.update(sample('pinch'),180);noise.update(sample('pinch',.5,.5,.7),240);
assert.equal(noise.update(sample('pinch',.5,.5,.7),350).command,null,'A fleeting contact is rejected');
noise.update(sample('pinch'),400);assert.equal(noise.update(sample('pinch',.5,.5,.4),520).command.id,'pointer.activate','Hysteresis tolerates minor contact-depth noise');
noise.update(null,540);noise.update(sample('pinch'),600);assert.equal(noise.update(sample('pinch'),750).command,null,'Reacquiring a held pinch cannot replay its click');
noise.update(sample('pointer'),1100);noise.update(sample('pointer'),1240);noise.update(sample('pinch'),1300);
assert.equal(noise.update(sample('pinch'),1420).command.id,'pointer.activate','A released pinch and fresh pointing can click again');
const expired=new GestureIntent();expired.update(sample('pointer'),0);expired.update(sample('pointer'),140);expired.update(sample('pinch'),1500);
assert.equal(expired.update(sample('pinch'),1650).command,null,'An old pointed target cannot be activated');

const back=new GestureIntent();back.update(sample('palm'),0);back.update(sample('palm'),220);
back.update(sample('pointer'),280);back.update(sample('pointer'),440);back.update(sample('fist'),480);
assert.equal(back.update(sample('fist'),610).command.id,'navigation.back','The last two fingers closing a palm cannot turn Back into Click');
const interrupted=new GestureIntent();interrupted.cooldown=2000;interrupted.update(sample('palm'),0);interrupted.update(sample('palm'),220);interrupted.update(sample('fist'),260);
assert.equal(interrupted.update(sample('fist'),400).command.id,'navigation.back','Back can interrupt a swipe/click cooldown');

const lost=new GestureIntent();lost.update(sample('pointer'),0);lost.update(sample('pointer'),140);lost.update(null,160);lost.update(sample('fist'),200);
assert.equal(lost.update(sample('fist'),350).command,null,'Tracking loss clears remembered click targets');
const swipe=new GestureIntent();swipe.update(sample('pointer',.8),0);swipe.update(sample('pointer',.8),140);swipe.update(sample('pointer',.72),180);swipe.update(sample('pointer',.60),220);
assert.equal(swipe.update(sample('pointer',.45),270).command.id,'project.next');
swipe.update(sample('palm',.45),300);assert.equal(swipe.update(sample('palm',.45),430).command,null,'Opening after a swipe cannot also click');
swipe.update(sample('fist',.45),450);assert.equal(swipe.update(sample('fist',.45),550).command,null,'Releasing a swipe cannot navigate Back');
swipe.update(sample('pinch'),600);assert.equal(swipe.update(sample('pinch'),750).command,null,'Pinching after a swipe cannot also click');
const right=new GestureIntent();right.update(sample('pointer',.2),0);right.update(sample('pointer',.2),140);right.update(sample('pointer',.3),200);
assert.equal(right.update(sample('pointer',.57),300).command.id,'project.previous');
const homePointer=new GestureIntent();homePointer.update(sample('pointer',.2),0,{allowSwipe:false});homePointer.update(sample('pointer',.2),140,{allowSwipe:false});
assert.equal(homePointer.update(sample('pointer',.7),300,{allowSwipe:false}).command,null,'Fast pointing across home cards is not a carousel swipe');
homePointer.update(sample('pinch',.7),350,{allowSwipe:false});assert.equal(homePointer.update(sample('pinch',.7),500,{allowSwipe:false}).command.id,'pointer.activate','A contextual swipe rejection cannot swallow the following click');
const slow=new GestureIntent();slow.update(sample('pointer',.2),0);for(let time=140;time<2500;time+=100)assert.equal(slow.update(sample('pointer',.2+time*.0001),time).command,null,'Normal slow cursor positioning is not a swipe');
const vertical=new GestureIntent();vertical.update(sample('pointer',.5,.8),0);vertical.update(sample('pointer',.5,.8),140);
assert.equal(vertical.update(sample('pointer',.5,.2),300).command,null,'Vertical movement is not project navigation');

// Rotate a fully extended hand around its wrist. At neutral the fingers
// point toward the camera horizontally; tipping down shows the back, up the
// palm. The projected image becomes edge-on, while metric joints retain reach.
function flap(degrees,mirror=false) {
  const source=hand('palm'),rotation=Math.PI/2+degrees*Math.PI/180;
  const world=source.map(p=>({x:(p.x-.5)*.2*(mirror?-1:1),y:(p.y-.94)*.2*Math.cos(rotation),z:(p.y-.94)*.2*Math.sin(rotation)}));
  const screen=world.map(p=>({x:.5+p.x*3,y:.5+p.y*3,z:p.z*3}));
  return classifyHand(screen,world);
}
for(const mirror of [false,true]) {
  assert.equal(flap(0,mirror).pose,'palm','An edge-on flat open hand is recognized');
  assert(Math.abs(flap(0,mirror).palmTilt)<1,'A flat hand is neutral');
  for(const degrees of [-55,-30,30,55]) {
    const detected=flap(degrees,mirror);assert.equal(detected.pose,'palm','Both camera-facing palm surfaces stay open');
    assert.equal(Math.sign(detected.palmTilt),Math.sign(degrees),'Tipped fingers determine direction for either hand');
  }
}
const open=(tilt=0)=>({...sample('palm'),palmTilt:tilt});
const scroll=new GestureIntent();scroll.update(open(),0);assert.equal(scroll.update(open(),200).scrolling,false,'The open hand must be held before scrolling');
assert.equal(scroll.update(open(),600).scroll.rate,0,'Holding the hand flat enables scrolling without moving the page');
for(const [time,tilt] of [[660,3],[730,-4],[800,5]])assert.equal(scroll.update(open(tilt),time).scroll.rate,0,'Small flat-hand tilt noise must not move the page');
let scrolling=scroll.update(open(30),950);assert(scrolling.scrolling);assert(scrolling.scroll.rate>0,'Fingertips down means Scroll down');
const gentle=scrolling.scroll.rate;scrolling=scroll.update(open(55),1090);
assert(scrolling.scroll.rate>gentle,'A larger flap angle scrolls faster');assert.equal(scrolling.command,null);
assert(scroll.update(open(55),1160).scroll.rate>0,'Holding the angle continues scrolling without repeated waves');
assert(scroll.update(open(-35),1250).scroll.rate<0,'Fingertips up reverses direction immediately');
assert.equal(scroll.update(open(),1400).scroll.rate,0,'Flattening the hand stops on the first sample without filter drift');
scroll.update(sample('fist'),1680);assert.equal(scroll.update(sample('fist'),1800).command,null,'Closing after tilt scroll releases instead of navigating Back');
const translated=new GestureIntent();translated.update(open(),0);translated.update(open(),200);translated.update(open(),600);
assert.equal(translated.update({...open(),point:{x:.9,y:.9},palmPoint:{x:.9,y:.9}},750).scroll.rate,0,'Moving a flat hand around the camera cannot cause scroll jitter');
translated.update(sample('fist'),800);assert.equal(translated.update(sample('fist'),950).command,null,'Closing a neutral scroll control cannot trigger Back');
const lPointer=new GestureIntent();lPointer.update(classifyHand(hand('lShape')),0);
assert.equal(lPointer.update(classifyHand(hand('lShape')),140).cursorMode,'point','The actual thumb-away L-shape moves the cursor');
assert.equal(lPointer.update(classifyHand(hand('lShape')),1000).scrolling,false,'Holding an L-shape never enables scroll');
lPointer.update(classifyHand(hand('pinch')),1100);assert.equal(lPointer.update(classifyHand(hand('pinch')),1240).command.id,'pointer.activate','Joining the thumb to both fingers clicks from the L-shape');
const geometryScroll=new GestureIntent();geometryScroll.update(flap(0),0);geometryScroll.update(flap(0),200);geometryScroll.update(flap(0),600);
assert(geometryScroll.update(flap(35),750).scroll.rate>0,'Back-of-hand downward flap reaches the scroll recognizer');
assert(geometryScroll.update(flap(-35),900).scroll.rate<0,'Palm-facing upward flap reaches the scroll recognizer');
assert.equal(geometryScroll.update(flap(0),1000).scroll.rate,0);
const lostScroll=new GestureIntent();lostScroll.update(open(),0);lostScroll.update(open(),200);lostScroll.update(open(),600);lostScroll.update(open(40),750);
assert.equal(lostScroll.update(null,780).scrolling,false,'Tracking loss ends scrolling');
lostScroll.update(open(),800);lostScroll.update(open(),950);assert.equal(lostScroll.update(open(),1800).scroll.rate,0,'Reacquiring a flat hand restarts without drift');
lostScroll.update(null,1900);lostScroll.update(open(),1930);lostScroll.update(open(),2070);lostScroll.update(sample('fist'),2180);
assert.equal(lostScroll.update(sample('fist'),2320).command,null,'A dropped frame cannot turn scroll release into Back');
const badTilt=new GestureIntent();badTilt.update(open(),0);badTilt.update(open(),200);badTilt.update(open(),600);badTilt.update(open(40),750);
assert.equal(badTilt.update(open(NaN),800).scroll.rate,0,'An unavailable orientation stops scrolling');
const lostRelease=new GestureIntent();lostRelease.update(sample('pointer'),0);lostRelease.update(sample('pointer'),140);lostRelease.update(sample('pinch'),180);lostRelease.update(sample('pinch'),320);
lostRelease.update(null,350);lostRelease.update(open(),380);lostRelease.update(open(),520);lostRelease.update(sample('fist'),600);
assert.equal(lostRelease.update(sample('fist'),720).command,null,'A dropped frame cannot turn click release into Back');
const cancelled=new GestureIntent();cancelled.update(open(),0);cancelled.update(open(),200);cancelled.update(open(),600);cancelled.update(open(40),800);cancelled.cancelScroll();
assert.equal(cancelled.update(open(40),1000).scrolling,false,'Navigation/voice overrides require releasing the previous palm');
cancelled.update(null,1020);cancelled.update(open(40),1030);assert.equal(cancelled.update(open(40),1200).scrolling,false,'A missed frame cannot undo a route override');
cancelled.update(sample('fist'),1250);cancelled.update(sample('fist'),1400);cancelled.update(open(),1500);cancelled.update(open(),1650);
assert.equal(cancelled.update(open(),2400).scroll.rate,0,'A fresh released hand can scroll again from flat');
const scrollRelease=new GestureIntent();scrollRelease.update(open(),0);scrollRelease.update(open(),200);scrollRelease.update(open(),600);
assert.equal(scrollRelease.update(sample('pinch'),820).scrolling,false,'Changing the open-hand pose stops scrolling immediately');
assert.equal(scrollRelease.update(sample('pinch'),950).command,null,'A scroll release cannot click without fresh pointing');
scrollRelease.update(open(),1000);scrollRelease.update(open(),1120);scrollRelease.update(sample('fist'),1200);
assert.equal(scrollRelease.update(sample('fist'),1320).command,null,'A scroll release cannot turn into Back');
const afterPoint=new GestureIntent();afterPoint.update(sample('pointer'),0);afterPoint.update(sample('pointer'),140);afterPoint.update(open(),180);afterPoint.update(open(),320);
assert.equal(afterPoint.update(open(30),800).scrolling,false,'Opening from a click target has a longer hold before scrolling');
assert(afterPoint.update(open(30),1000).scroll.rate>0,'The deliberate held open hand can scroll after pointing');
console.log('Gestures passed: L-shape pointing, captured thumb-contact Click, precontact lock, tilted/back-facing open-hand scroll, neutral/reversal, release guards, tracking loss, Back and swipe conflicts.');
