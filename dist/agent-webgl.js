// The portfolio owns position and travel; Mascott owns the face and its WebGL lifecycle.
import {readMascotLook,MASCOT_SETTINGS_EVENT} from './mascot-settings.js';

function configure(element,root,doc){
 const size=root.offsetWidth||Number.parseFloat(doc.defaultView.getComputedStyle(root).getPropertyValue('--agent-size'));
 if(!Number.isFinite(size)||size<=0)throw new Error('Mascott stage size is unavailable.');
 const look=readMascotLook(doc);
 const animated=doc.documentElement.dataset.animation!=='off';
 element.config={
  look:{...look,eyes:'capsule',eyeTone:'white',motion:animated?look.motion:'still'},
  behaviour:{follow:animated?'pointer':'none',alive:animated,reducedMotion:'respect'},
  placement:{mode:'inline',size}
 };
}

export function mountAgentWebGL(root,shell,doc=document){
 const element=doc.createElement('mascott-embed');
 element.className='agent-live agent-face';
 let destroyed=false,loaded=false;
 const status=()=>{
  const stage=element.querySelector('.mascott-stage');
  root.dataset.renderer=stage?.dataset.status==='ready'?'webgl':'png';
 };
 const report=event=>{
  if(event.detail.type==='error')console.warn('The WebGL mascot is unavailable; keeping the PNG fallback.',event.detail.message);
 };
 const changed=new MutationObserver(status),resized=new ResizeObserver(()=>configure(element,root,doc));
 const refresh=()=>{if(loaded)configure(element,root,doc);};
 const preference=new MutationObserver(refresh);
 doc.addEventListener(MASCOT_SETTINGS_EVENT,refresh);
 element.addEventListener('mascott',report);
 import('./vendor/mascott/mascott-embed.js').then(()=>{
  if(destroyed)return;
  doc.defaultView.customElements.upgrade(element);
  loaded=true;
  configure(element,root,doc);
  changed.observe(element,{subtree:true,childList:true,attributes:true,attributeFilter:['data-status']});
  shell.append(element);
  resized.observe(root);
  preference.observe(doc.documentElement,{attributes:true,attributeFilter:['data-animation']});
 }).catch(error=>{
  if(!destroyed)console.warn('The mascot bundle could not load; keeping the PNG fallback.',error);
 });
 return {destroy(){
  destroyed=true;changed.disconnect();resized.disconnect();preference.disconnect();
  doc.removeEventListener(MASCOT_SETTINGS_EVENT,refresh);
  element.removeEventListener('mascott',report);element.remove();
 }};
}
