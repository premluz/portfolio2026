import {createLabFilter,RING_RADIUS} from './lab-filter.js';
import {LAB_RIPPLE} from './motion-tokens.js';

// Entering or leaving the Lab sends a single ring out from the click. The page
// changes while the ring is mid-flight; the destination resumes the same ring
// from the stored origin and progress, so it reads as one continuous ripple.
const HANDOFF_KEY='prem-lab-handoff';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=value=>Math.min(1,Math.max(0,value));

function readHandoff(){
 try{
  const raw=sessionStorage.getItem(HANDOFF_KEY);sessionStorage.removeItem(HANDOFF_KEY);
  const value=raw&&JSON.parse(raw);
  return value&&Number.isFinite(value.x)&&Number.isFinite(value.y)&&Number.isFinite(value.progress)?value:null;
 }catch(error){console.warn('Lab ripple handoff unreadable; arriving without the ripple',error);return null;}
}
function writeHandoff(value){
 try{sessionStorage.setItem(HANDOFF_KEY,JSON.stringify(value));}
 catch(error){console.warn('Lab ripple handoff not stored; destination will arrive still',error);}
}

// Far enough that the ring has fully left the viewport when progress reaches 1.
const reach=(x,y)=>Math.max(Math.hypot(x,y),Math.hypot(innerWidth-x,y),Math.hypot(x,innerHeight-y),Math.hypot(innerWidth-x,innerHeight-y))+LAB_RIPPLE.ringWidth*RING_RADIUS*innerWidth;

// Quick swell, then the ring loses strength as it spreads, like the image hover ripple.
const envelope=progress=>(1-Math.exp(-progress*LAB_RIPPLE.swell))*(1-progress)**LAB_RIPPLE.fade;

class LabRipple{
 constructor(){this.filter=createLabFilter();this.raf=0;}
 /** Runs the ring from `from` to `to` progress; origin is in viewport fractions. */
 play(origin,from,to){
  cancelAnimationFrame(this.raf);
  const duration=(to-from)*LAB_RIPPLE.durationMs,start=performance.now();
  return new Promise(resolve=>{
   const frame=t=>{
    const progress=from+(to-from)*clamp((t-start)/duration),x=origin.x*innerWidth,y=origin.y*innerHeight;
    const radius=reach(x,y)*(1-(1-progress)**2);
    this.filter.apply({x,y,radius,amplitude:envelope(progress)});
    if(t-start<duration)this.raf=requestAnimationFrame(frame);
    else{this.raf=0;if(progress>=1)this.stop();resolve();}
   };
   this.raf=requestAnimationFrame(frame);
  });
 }
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.filter.apply({x:0,y:0,radius:0,amplitude:0});}
}

function whenRevealed(callback){
 const root=document.documentElement;
 if(!root.classList.contains('page-booting'))return callback();
 const observer=new MutationObserver(()=>{if(!root.classList.contains('page-booting')){observer.disconnect();callback();}});
 observer.observe(root,{attributes:true,attributeFilter:['class']});
}

// Keyboard activation has no pointer position, so the ring starts at the control.
function originOf(event,control){
 if(event.detail>0)return {x:event.clientX/innerWidth,y:event.clientY/innerHeight};
 const rect=control.getBoundingClientRect();
 return {x:(rect.left+rect.width/2)/innerWidth,y:(rect.top+rect.height/2)/innerHeight};
}

/** Links marked data-lab-transition="enter|exit" travel through the ripple. */
export function installLabTransition(){
 const ripple=new LabRipple();let leaving=false;
 const onLabPage=document.documentElement.hasAttribute('data-lab-page');
 const travel=(origin,href)=>{
  if(leaving)return;leaving=true;
  if(reduced.matches){location.href=href;return;}
  writeHandoff({...origin,progress:LAB_RIPPLE.handoff});
  ripple.play(origin,0,LAB_RIPPLE.handoff).then(()=>{location.href=href;});
 };
 // Capture phase: on the Lab page the site menu's in-app route buttons must leave
 // this document, so they are claimed before the app's own menu handler runs.
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[data-lab-transition]'),route=onLabPage&&event.target.closest?.('[data-page-menu-item]');
  if(!link&&!route)return;
  event.preventDefault();event.stopPropagation();
  if(route)return travel(originOf(event,route),'./#'+route.dataset.pageMenuItem);
  if(onLabPage&&link.dataset.labTransition==='enter')return;
  travel(originOf(event,link),link.href);
 },true);
 addEventListener('pageshow',event=>{if(event.persisted){leaving=false;ripple.stop();}});
 const handoff=readHandoff();
 if(!handoff||reduced.matches)return;
 const root=document.documentElement;root.classList.add('lab-arriving');
 whenRevealed(()=>{ripple.play(handoff,clamp(handoff.progress),1).then(()=>root.classList.remove('lab-arriving'));});
}

installLabTransition();
