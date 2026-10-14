// Word-gradient reveal adapted from Iconiq StreamingText (MIT). vendor/iconiq/.
export function streamGradientOffset(index){const cycle=10,step=index%cycle,phase=step<6?step:cycle-step;return `${phase/5*100}% 50%`;}
export function streamText(element,text,{reduced=false,speed=120,settleDelay=300,onComplete=()=>{}}={}){
 const value=String(text||'');if(!element)return ()=>{};
 const parts=[...value.matchAll(/\S+\s*/gu)];let frame=0,timer=0,start=null,shown=0,done=false;
 const finish=()=>{if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(timer);element.textContent=value;element.classList.remove('iconiq-stream');onComplete();};
 if(reduced||!parts.length){element.textContent=value;onComplete();return ()=>{};}
 element.textContent='';element.removeAttribute('aria-label');element.classList.add('iconiq-stream');
 const accessible=document.createElement('span'),visual=document.createElement('span'),cursor=document.createElement('span');accessible.className='sr';accessible.textContent=value;visual.setAttribute('aria-hidden','true');cursor.className='iconiq-stream-cursor';element.append(accessible,visual);visual.append(cursor);
 if(parts[0].index)visual.insertBefore(document.createTextNode(value.slice(0,parts[0].index)),cursor);
 const appendWord=(part,index)=>{
  const raw=part[0],word=raw.match(/^\S+/u)[0],wrapper=document.createElement('span'),base=document.createElement('span'),tint=document.createElement('span');wrapper.className='iconiq-stream-word';base.className='iconiq-stream-base';tint.className='iconiq-stream-tint';base.textContent=word;tint.textContent=word;tint.style.backgroundPosition=streamGradientOffset(index);wrapper.style.setProperty('--stream-settle-delay',settleDelay+'ms');wrapper.append(base,tint);visual.insertBefore(wrapper,cursor);visual.insertBefore(document.createTextNode(raw.slice(word.length)),cursor);
 };
 const tick=now=>{
  if(done)return;if(start===null)start=now;
  const count=Math.min(parts.length,1+Math.floor(Math.max(0,now-start)/Math.max(16,speed)));
  while(shown<count){appendWord(parts[shown],shown);shown++;}
  if(shown<parts.length)frame=requestAnimationFrame(tick);
  else{cursor.remove();timer=setTimeout(finish,settleDelay+450);}
 };
 frame=requestAnimationFrame(tick);return finish;
}
