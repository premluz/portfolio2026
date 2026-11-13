import {graphemes} from './text-stream-engine.js';
import {streamEdgeText} from './text-stream-edge.js';
import {readTextEffects} from './text-effects-settings.js';
const streamTiming=Object.freeze({minimumRate:45,maximumRate:220,ratePerPendingGrapheme:3.5,animationDuration:400});

// effects.effect picks the style (Developer settings › Motion › Assistant text effects): Classic is the original
// per-character fade below; feather and scramble stream behind a moving edge (text-stream-edge.js).
export function streamText(element,text,{reduced=false,onComplete=()=>{},effects=readTextEffects()}={}){
 if(effects.effect!=='classic')return streamEdgeText(element,text,{reduced,onComplete,style:effects});
 const value=String(text||'');if(!element)return ()=>{};
 const parts=graphemes(value);let frame=0,timer=0,lastFrame=null,credit=0,shown=0,done=false;
 const finish=()=>{if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(timer);element.textContent=value;element.classList.remove('vivid-stream');element.setAttribute('aria-busy','false');onComplete();};
 if(reduced||!parts.length){element.textContent=value;element.setAttribute('aria-busy','false');onComplete();return ()=>{};}
 element.textContent='';element.removeAttribute('aria-label');element.setAttribute('aria-busy','true');element.classList.add('vivid-stream');
 const accessible=document.createElement('span'),visual=document.createElement('span');
 accessible.className='sr';accessible.textContent=value;visual.setAttribute('aria-hidden','true');element.append(accessible,visual);
 const tick=now=>{
  if(done)return;
  const elapsed=lastFrame===null?16.67:Math.max(0,now-lastFrame);lastFrame=now;
  const backlog=parts.length-shown,rate=Math.min(streamTiming.maximumRate,Math.max(streamTiming.minimumRate,backlog*streamTiming.ratePerPendingGrapheme));
  credit+=elapsed*rate/1000;
  const count=Math.min(parts.length,shown+Math.max(1,Math.floor(credit)));credit=Math.max(0,credit-(count-shown));
  while(shown<count){const character=document.createElement('span');character.className='vivid-stream-character';character.textContent=parts[shown++];visual.append(character);}
  if(shown<parts.length)frame=requestAnimationFrame(tick);
  else timer=setTimeout(finish,streamTiming.animationDuration);
 };
 frame=requestAnimationFrame(tick);return finish;
}
