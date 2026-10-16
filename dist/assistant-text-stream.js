const streamTiming=Object.freeze({minimumRate:45,maximumRate:220,ratePerPendingGrapheme:3.5,animationDuration:400});

function graphemes(text){
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
 return segmenter?[...segmenter.segment(text)].map(part=>part.segment):Array.from(text);
}

export function streamText(element,text,{reduced=false,onComplete=()=>{}}={}){
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
