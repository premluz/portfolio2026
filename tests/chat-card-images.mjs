import assert from 'node:assert/strict';
import {ImageFrame,thumbnailImageRadius} from '../dist/image-frame.js';
import {hideMorphSource} from '../dist/morph-visibility.js';
for(const width of [100,200,400,1000])assert.equal(thumbnailImageRadius(20,{width,height:width/1.6}),20*width/1000);
for(const height of [70,140,350,700])assert.equal(thumbnailImageRadius(20,{width:height*.47,height},'portrait'),20*height/700);
assert.equal(thumbnailImageRadius(0,{width:120,height:75}),0,'Sharp rounding remains sharp at preview size');
assert.equal(thumbnailImageRadius(6,{width:120,height:75},'landscape',{radius:34,width:1440}),34*120/1440,'Source matte corners still get masked at their actual scale');
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const card={dataset:{cardOrientation:'landscape'},matches:()=>true,closest:()=>null,classList:{contains:()=>true}};
const img={naturalWidth:1600,naturalHeight:900,style:{},addEventListener(){},removeEventListener(){}},edge={style:{}};
const el={clientWidth:120,clientHeight:94,style:{setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}},closest:()=>card,querySelector:s=>s==='img'?img:s===':scope > .image-edge'?edge:null};
globalThis.getComputedStyle=n=>n===card?{borderTopLeftRadius:'16px',paddingTop:'20px',paddingBottom:'20px',paddingLeft:'20px',paddingRight:'20px'}:{getPropertyValue:k=>k==='--image-rounding'?'20px':'0px'};
const frame=new ImageFrame(el);assert.equal(parseFloat(img.style.borderRadius),2.4,'The real compact image receives the proportional setting');assert.equal(edge.style.borderRadius,img.style.borderRadius);assert.equal(parseFloat(img.style.width),120);assert.equal(parseFloat(img.style.height),67.5);assert.equal(el.style.overflow,'visible');
img.naturalWidth=402;img.naturalHeight=858;card.dataset.cardOrientation='portrait';frame.resize();assert(Math.abs(parseFloat(img.style.borderRadius)-20*94/700)<1e-10);assert.equal(parseFloat(img.style.height),94);frame.destroy();
const values={},priorities={},style={get visibility(){return values.visibility||'';},get opacity(){return values.opacity||'';},getPropertyPriority:name=>priorities[name]||'',setProperty(name,value,priority=''){values[name]=value;priorities[name]=priority;},removeProperty(name){delete values[name];delete priorities[name];}},source={isConnected:true,style};
for(const initial of ['', 'visible'])for(const opacity of ['', '.65']){style.setProperty('visibility',initial,initial?'important':'');style.setProperty('opacity',opacity,opacity?'important':'');const release=hideMorphSource(source);assert.equal(style.visibility,'hidden');assert.equal(style.opacity,'0','A parent opacity hides even descendants with explicit visibility:visible');assert.equal(style.getPropertyPriority('opacity'),'important','Entry/hover animations cannot make the stationary card reappear');release();assert.equal(style.visibility,initial,'A retained chat card recovers its original visibility');assert.equal(style.opacity,opacity,'The handoff restores the card’s existing opacity');assert.equal(style.getPropertyPriority('visibility'),initial?'important':'');assert.equal(style.getPropertyPriority('opacity'),opacity?'important':'');release();assert.equal(style.opacity,opacity,'Repeated cleanup is harmless');}
assert.doesNotThrow(()=>hideMorphSource(null)());
console.log('Chat images passed: proportional portrait/landscape corners, baked matte, native/border agreement and retained source visibility.');
