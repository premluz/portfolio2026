import assert from 'node:assert/strict';
import {SpatialNavigation} from '../dist/spatial-navigation.js';
import {createCommandCatalog} from '../dist/interaction-commands.js';
import {projects} from '../dist/documents.js';
import {GestureIntent} from '../dist/gesture-intent.js';

const originals=Object.fromEntries(['document','window','addEventListener'].map(key=>[key,globalThis[key]]));
const listeners=new Map(),nodes=new Map();
function node(id) {
  const classes=new Set();const label={textContent:''};
  return {id,hidden:true,open:false,dataset:{},style:{},textContent:'',attrs:{},disabled:false,classList:{add:className=>classes.add(className),remove:(...names)=>names.forEach(name=>classes.delete(name)),toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
    setAttribute(key,value){this.attrs[key]=value;},querySelector:()=>label,focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;},addEventListener(type,handler){listeners.set(id+':'+type,handler);}};
}
for(const id of ['interactionGuide','interactionConfirm','interactionCancel','interactionSetupStatus','interactionFeedback','voicePreference','gesturePreference','voiceStatus','gestureStatus','gestureCursor','gestureScrollControl','interactionHud','voiceStop','gesturesStop','interactionGuideTitle','interactionGuideHint','interactionPrivacy','assistantIndexToggle'])nodes.set(id,node(id));
nodes.get('gestureScrollControl').style.setProperty=function(key,value){this[key]=value;};
globalThis.document={hidden:false,getElementById:id=>nodes.get(id),addEventListener:(event,handler)=>listeners.set('document:'+event,handler)};
globalThis.window={innerWidth:1000,innerHeight:800,scrollBy(){}};globalThis.addEventListener=(event,handler,options)=>listeners.set('window:'+event+(options===true?':capture':''),handler);
try {
  let commands=0,prepares=0,starts=0,resolve;
  let busy=false;const routed=[];
  const bus={pending:0,getState:()=>({busy}),dispatch:async command=>{commands++;routed.push(command);if(command.id==='project.open')spatial.cancelScroll();return {ok:true,message:'Opened'};}};
  const spatial=new SpatialNavigation(createCommandCatalog(projects),bus,{beforeGuide:()=>prepares++});
  assert.equal(spatial.voice.enabled,false);assert.equal(spatial.gestures.enabled,false);assert(nodes.get('interactionHud').hidden,'Capture never restores itself on load');
  for(const mode of ['voice','gestures']){
    spatial[mode].pause=function(){this.paused=true;};spatial[mode].resume=function(){this.paused=false;};
  }
  spatial.showGuide('help');await spatial.enable();assert(!spatial.dialog.open);assert.equal(starts,0,'The site guide never activates a camera or microphone');prepares=0;
  spatial.voice.start=()=>{starts++;return new Promise(done=>resolve=done);};
  spatial.showGuide('voice');assert.equal(prepares,1);assert.equal(starts,0,'The guide itself never asks for a microphone');
  assert(spatial.dialog.open);assert.equal(spatial.confirm.textContent,'OK');
  assert.match(nodes.get('interactionPrivacy').textContent,/may process audio online/,'Native speech consent describes possible provider processing');
  assert(!/model may download/.test(nodes.get('interactionGuideHint').textContent));
  const cancelled=spatial.enable();assert.equal(starts,1);assert(spatial.confirm.disabled);spatial.closeGuide(true);resolve(true);await cancelled;
  assert(!spatial.dialog.open);assert.equal(nodes.get('voicePreference').attrs['aria-checked'],'false','Late setup cannot turn a cancelled toggle on');
  spatial.voice.start=async()=>{spatial.voice.enabled=true;spatial.voice.onChange(true);return true;};
  spatial.showGuide('voice');await spatial.enable();assert.equal(nodes.get('voicePreference').attrs['aria-checked'],'true');assert(!nodes.get('voiceStatus').hidden);assert(nodes.get('assistantIndexToggle').focused,'Guide returns focus to a visible navigation control');
  spatial.gestures.start=async()=>{throw Error('Permission denied');};
  spatial.showGuide('gestures');assert(spatial.voice.paused);await spatial.enable();assert(spatial.dialog.open);assert.equal(spatial.message.textContent,'Permission denied');assert(!spatial.confirm.disabled);assert.equal(nodes.get('gesturePreference').attrs['aria-checked'],'false');
  assert.match(nodes.get('interactionPrivacy').textContent,/entirely on your device/);assert.match(nodes.get('interactionGuideHint').textContent,/angled/);
  let prevented=false,stopped=false;listeners.get('window:keydown:capture')({key:'Escape',preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
  assert(prevented&&stopped);assert(!spatial.dialog.open);assert(!spatial.voice.paused);assert.equal(commands,0,'Escape in onboarding cannot also navigate the page');
  spatial.gestures.start=async()=>{spatial.gestures.enabled=true;spatial.gestures.onChange(true);return true;};
  spatial.showGuide('gestures');await spatial.enable();assert(spatial.voice.enabled&&spatial.gestures.enabled,'Both input modes can coexist');

  // Replay a pointed card, thumb approaching, then fingertip contact through
  // the real cursor and controller. The native handler must reach navigation.
  let hits=0,clicked=0;const target={isConnected:true,disabled:false,classList:{add(){},remove(){}},closest(selector){return selector.startsWith('button')?this:null;},focus(){},getAttribute:()=> 'Open PlayStation',click(){clicked++;bus.dispatch({id:'project.open',target:'playstation',source:'pointer'});}};
  globalThis.document.elementFromPoint=()=>{hits++;return target;};
  const intent=new GestureIntent(),sample=(pose,x=.3,y=.4,pinchDistance=.15)=>({pose,point:{x,y},swipePoint:{x,y},pinchDistance});
  spatial.gestures.intent=intent;
  await spatial.frame(intent.update(sample('pointer'),0));await spatial.frame(intent.update(sample('pointer'),140));
  const pointedHits=hits;globalThis.document.elementFromPoint=()=>{hits++;return null;};
  await spatial.frame(intent.update(sample('pinch',.8,.9,.65),180));await spatial.frame(intent.update(sample('pinch',.8,.9,.65),320));
  await spatial.frame(intent.update(sample('pinch',.8,.9),370));await spatial.frame(intent.update(sample('pinch',.8,.9),490));
  assert.equal(hits,pointedHits,'Thumb approach and contact do not change the captured target');assert.equal(clicked,1);
  assert.equal(routed.at(-1).target,'playstation','A detected gesture click actually invokes the card-opening handler');
  await spatial.frame(intent.update(sample('pinch'),620));assert.equal(clicked,1,'Holding the thumb contact cannot open twice');
  assert.equal(intent.update(sample('pinch'),1300).scrolling,false,'A held click cannot scroll the newly opened page');
  await spatial.frame(intent.update(sample('fist'),1400));await spatial.frame(intent.update(sample('fist'),1520));assert.equal(routed.at(-1).id,'project.open','Releasing the click cannot reverse the project that just opened');
  globalThis.document.elementFromPoint=()=>target;spatial.cursor.move({x:.3,y:.4});
  await spatial.frame({cursor:null,command:{id:'pointer.activate',point:{x:.3,y:.4}}});assert.equal(clicked,2,'Activation is independent of whether its frame also supplies a cursor');
  busy=true;await spatial.frame({cursor:null,command:{id:'pointer.activate',point:{x:.3,y:.4}}});assert.equal(clicked,2,'Clicks still respect ongoing liquid transitions');busy=false;
  spatial.cursor.clear();await spatial.frame({cursor:null,command:{id:'pointer.activate',point:{x:.3,y:.4}}});assert.equal(clicked,2,'A missing/cleared target cannot be clicked');

  let scrolling=0,time=0,serial=0;const frames=new Map();globalThis.document.elementFromPoint=()=>null;globalThis.window.scrollBy=options=>scrolling+=options.top;
  globalThis.window.performance={now:()=>time};globalThis.window.requestAnimationFrame=callback=>{frames.set(++serial,callback);return serial;};globalThis.window.cancelAnimationFrame=id=>frames.delete(id);
  const advance=()=>{time+=16;const current=[...frames];frames.clear();for(const [,callback] of current)callback(time);};
  await spatial.frame({scrolling:true,scroll:{rate:.5,point:{x:.4,y:.4}},cursor:null});advance();assert(scrolling>0,'Open-hand tilt rate reaches actual display-frame scrolling');
  assert(!nodes.get('gestureScrollControl').hidden);assert.equal(nodes.get('gestureScrollControl').dataset.direction,'down');
  await spatial.frame({scrolling:true,scroll:{rate:0},cursor:null});assert.equal(frames.size,0);assert.equal(nodes.get('gestureScrollControl').dataset.direction,'neutral');
  busy=true;const before=scrolling;await spatial.frame({scrolling:true,scroll:{rate:.5},cursor:null});advance();assert.equal(scrolling,before,'Scrolling cannot fight a liquid transition');busy=false;
  spatial.scrollPage(-1,{smooth:false});assert(scrolling<before,'Voice Up uses the same viewport adapter');assert(nodes.get('gestureScrollControl').hidden);
  spatial.scrollPage(1);assert(frames.size>0);listeners.get('window:wheel')({isTrusted:true});assert.equal(frames.size,0,'Physical wheel input takes priority over a voice/hand scroll');
  await spatial.frame({scrolling:true,scroll:{rate:.5},cursor:null});assert(frames.size>0);
  globalThis.document.hidden=true;listeners.get('document:visibilitychange')();
  assert(!spatial.voice.enabled&&!spatial.gestures.enabled);assert(nodes.get('interactionHud').hidden,'Hiding the page stops both input modes');
  assert.equal(frames.size,0,'Hidden-page shutdown also stops the scroll display loop');
  console.log('Spatial integration passed: consent, captured thumb-contact Click, busy gates, neutral scroll feedback, voice viewport routing and hidden-page cleanup.');
}finally{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
