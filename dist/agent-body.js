// The agent's one persistent body. Position is two custom properties the stylesheet turns into a transform;
// the shell carries emerge, collapse and landing so they never fight the position.
import {mountAgentWebGL} from './agent-webgl.js';

export function createAgentBody(doc=document){
 const root=doc.createElement('div');
 root.className='agent';root.dataset.state='hidden';root.dataset.renderer='png';root.setAttribute('aria-hidden','true');
 root.innerHTML='<div class="agent-shell"><img class="agent-face agent-fallback" src="assets/agent.png" width="144" height="144" alt="" decoding="async" draggable="false"></div>';
 doc.body.append(root);
 const shell=root.firstElementChild,face=shell.firstElementChild,webgl=mountAgentWebGL(root,shell,doc);
 let animation=null;
 return {
  ready:()=>face.decode().catch(error=>{throw new Error('The agent image could not be decoded.',{cause:error});}),
  size:()=>root.offsetWidth,
  place({x,y}){root.style.setProperty('--agent-x',x+'px');root.style.setProperty('--agent-y',y+'px');},
  setState(state){root.dataset.state=state;},
  // Resolves true when the motion finished, false when another motion replaced it. `keep` holds the final
  // frame (a collapsed body stays hidden until it emerges again).
  play(frames,options,{keep=false}={}){
   animation?.cancel();
   const current=shell.animate(frames,{...options,fill:'both'});animation=current;
   return current.finished.then(()=>{if(animation!==current)return false;if(!keep){current.cancel();animation=null;}return true;},error=>{if(error?.name!=='AbortError')throw error;return false;});
  },
  stop(){animation?.cancel();animation=null;},
  destroy(){animation?.cancel();webgl.destroy();root.remove();}
 };
}
