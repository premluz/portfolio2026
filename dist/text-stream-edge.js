import {FRAME,advance,revealEdge,revealShown,scrambleUnit,split,tokenize} from './text-stream-engine.js';

// Streaming text behind a moving edge (PremLab's StreamingText): the edge fades the newest units in (feather) or
// shows stand-in glyphs that resolve (scramble). Three runs share one laid-out paragraph: settled text, the edge,
// and the pending rest, which is present but unpainted, so the paragraph never reflows. Screen readers get the
// whole text once from a hidden copy; when the edge settles the element holds one plain text node again.
const node=(tag,className)=>{const element=document.createElement(tag);if(className)element.className=className;return element;};
const ATTRIBUTES=['data-effect','data-tint','data-color','data-font'];
// The edge moves at a rate for an arriving answer (StreamingText), or, given reveal timing, by elapsed time for a
// heading that should land in a near-fixed time (TextReveal). next(now) returns the edge's position.
function pacer(count,style,timing){
 if(timing){const edge=revealEdge(count,timing);let start=null;return {edge,total:count+edge,next:now=>{start??=now;return revealShown(now-start,count,timing);}};}
 const total=count+style.edge,pace={rate:style.speed,catchUp:style.catchUp};let last=null,progress={shown:0,credit:0};
 return {edge:style.edge,total,next:now=>{
  const elapsed=last===null?FRAME.firstMs:Math.min(FRAME.maxMs,Math.max(0,now-last));last=now;
  progress=advance(progress,total,elapsed,pace);return progress.shown;
 }};
}

export function streamEdgeText(element,text,{reduced=false,onComplete=()=>{},style,timing=null}){
 const value=String(text||'');if(!element)return ()=>{};
 const units=tokenize(value,style.unit);
 if(reduced||!units.length){element.textContent=value;element.setAttribute('aria-busy','false');onComplete();return ()=>{};}
 const pace=pacer(units.length,style,timing);
 let frame=0,shown=0,painted=null,settledLength=-1,done=false;
 const accessible=node('span','sr'),visual=node('span'),settled=document.createTextNode(''),edge=node('span','edge-stream-edge'),pending=node('span','edge-stream-pending');
 accessible.textContent=value;visual.setAttribute('aria-hidden','true');
 visual.append(settled,edge);if(style.caret)visual.append(node('span','edge-stream-caret'));visual.append(pending);
 element.textContent='';element.removeAttribute('aria-label');element.setAttribute('aria-busy','true');element.classList.add('edge-stream');
 for(const [name,attribute] of [['effect','data-effect'],['tint','data-tint'],['color','data-color'],['font','data-font']])element.setAttribute(attribute,style[name]);
 element.append(accessible,visual);
 const paint=tick=>{
  const key=`${shown}:${tick}`;if(key===painted)return;painted=key;
  const segments=split(units,shown,pace.edge);
  // The settled run only grows, so its text node is rewritten only when it does.
  if(segments.settled.length!==settledLength){settledLength=segments.settled.length;settled.textContent=segments.settled;}
  edge.textContent=style.effect==='scramble'?segments.edge.map((unit,index)=>scrambleUnit(unit,segments.edgeStart+index,tick,style.glyphs)).join(''):segments.edge.join('');
  pending.textContent=segments.pending;
 };
 const finish=()=>{
  if(done)return;done=true;cancelAnimationFrame(frame);
  element.textContent=value;element.classList.remove('edge-stream');for(const attribute of ATTRIBUTES)element.removeAttribute(attribute);
  element.setAttribute('aria-busy','false');onComplete();
 };
 const step=now=>{
  if(done)return;
  shown=pace.next(now);paint(Math.floor(now/style.swap));
  if(shown<pace.total)frame=requestAnimationFrame(step);else finish();
 };
 // Laid out before the first frame, so the paragraph already has its final height and never reflows.
 paint(0);frame=requestAnimationFrame(step);return finish;
}
