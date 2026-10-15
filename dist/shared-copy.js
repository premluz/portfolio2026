const mix=(a,b,t)=>a+(b-a)*t;
const normalized=value=>String(value||'').trim().replace(/\s+/g,' ');
export function sharedCopyNode(host,key){
 const external=host?.morphCopyRoot;
 const gallery={title:'[data-gallery-title]',client:'[data-gallery-client]',summary:'[data-gallery-description]'};
 const standard={title:'h1,h2',client:'.card-client,.project-client',category:'.eyebrow',summary:'.project-summary,.info-summary'};
 return external&&gallery[key]?external.querySelector(gallery[key]):host?.querySelector(standard[key]);
}
export function sharedLead(node,key='summary'){
 return key==='summary'?node?.querySelector?.('[data-summary-lead]')||node:node;
}
export function copyOpacity(node,host){
 let opacity=1;
 for(let current=node;current&&current!==host;current=current.parentElement){
  const value=parseFloat(getComputedStyle(current).opacity);if(Number.isFinite(value))opacity*=value;
 }
 return opacity;
}
export function copyScale(node){
 const scale={x:1,y:1};if(!globalThis.DOMMatrixReadOnly)return scale;
 for(let current=node;current;current=current.parentElement){
  const transform=getComputedStyle(current).transform;if(!transform||transform==='none')continue;
  const matrix=new DOMMatrixReadOnly(transform);scale.x*=Math.hypot(matrix.a,matrix.b);scale.y*=Math.hypot(matrix.c,matrix.d);
 }
 return scale;
}
// Measure once before movement. Words keep their own endpoints when a title or
// sentence wraps differently; resizing a paragraph mid-flight would reflow it.
export function captureSharedWords(node,key){
 const lead=sharedLead(node,key),doc=lead?.ownerDocument||globalThis.document;
 if(!lead||!doc?.createRange||!doc.createTreeWalker)return null;
 const walker=doc.createTreeWalker(lead,5),texts=[];let current,length=0;
 while((current=walker.nextNode())){
  if(current.nodeType===1){if(current.tagName==='BR'){texts.push({text:' ',start:length,end:++length});}continue;}
  const text=current.textContent;texts.push({node:current,text,start:length,end:length+text.length});length+=text.length;
 }
 const text=texts.map(item=>item.text).join(''),words=[];
 for(const match of text.matchAll(/\S+/g)){
  const start=match.index,end=start+match[0].length,first=texts.find(item=>item.end>start),last=texts.find(item=>item.end>=end);if(!first||!last)continue;
  const range=doc.createRange();range.setStart(first.node,start-first.start);range.setEnd(last.node,end-last.start);
  const rect=range.getBoundingClientRect(),style=getComputedStyle(first.node.parentElement);
  if(!Number.isFinite(rect.left)||!rect.width||!rect.height)return null;
  words.push({text:match[0],rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},opacity:copyOpacity(first.node.parentElement,node),textTransform:style.textTransform||'none'});
 }
 return words.length?words:null;
}
// A heading copy that cannot use per-word slots keeps the measured source rows. Width and
// font size change every frame, so letting it wrap freely would re-break its lines mid-flight.
export function lockLineBreaks(node,words){
 if(!node||!words?.length)return false;
 const rows=[];
 for(const word of words){const row=rows.find(item=>Math.abs(item.top-word.rect.top)<word.rect.height/2);if(row)row.words.push(word.text);else rows.push({top:word.rect.top,words:[word.text]});}
 node.textContent='';
 rows.forEach((row,index)=>{if(index)node.append(node.ownerDocument.createElement('br'));node.append(row.words.join(' '));});
 node.style.whiteSpace='nowrap';
 return true;
}
export function createSharedWords(source,targetWords,node,key,shell){
 const words=source.words;
 if(!words?.length||words.length!==targetWords?.length||words.some((word,index)=>normalized(word.text)!==normalized(targetWords[index].text)))return null;
 const proxy=document.createElement('div');proxy.className='flow-shared-words';proxy.setAttribute('aria-hidden','true');
 const spans=words.map(word=>{const span=document.createElement('span');span.textContent=word.text;Object.assign(span.style,{position:'absolute',margin:'0',padding:'0',whiteSpace:'pre',fontFamily:source.fontFamily,fontWeight:source.fontWeight,textTransform:word.textTransform,transformOrigin:'0 0'});proxy.append(span);return span;});
 // The paragraph still owns new context and streaming. Its common lead is
 // represented exclusively by these word slots until the native handoff.
 const lead=sharedLead(node,key);
 if(lead!==node)lead.style.visibility='hidden';
 else if(key==='summary'&&node.querySelectorAll('[data-card-copy-word]').length)node.querySelectorAll('[data-card-copy-word]').forEach(word=>word.style.visibility='hidden');
 else node.style.visibility='hidden';
 shell.append(proxy);
 return {
  paint(item,{x,y,xPos,yPos,textP,opacity,fontSize,lineHeight,letterSpacing,color,fontWeight}){
   const dx=xPos-mix(item.a.left,item.b.left,textP),dy=yPos-mix(item.a.top,item.b.top,textP);
   proxy.style.opacity=String(opacity);
   for(let i=0;i<spans.length;i++){
    const a=words[i],b=targetWords[i];
    const ratio=mix((item.scaleA?.x||1)/(item.scaleA?.y||1),(item.scaleB?.x||1)/(item.scaleB?.y||1),textP);
    Object.assign(spans[i].style,{left:mix(a.rect.left,b.rect.left,textP)+dx-x+'px',top:mix(a.rect.top,b.rect.top,textP)+dy-y+'px',lineHeight:mix(a.rect.height,b.rect.height,textP)+'px',fontSize:fontSize+'px',fontWeight,letterSpacing:letterSpacing+'px',color,opacity:String(mix(a.opacity,b.opacity,textP)),transform:ratio===1?'none':`scaleX(${ratio})`});
   }
  }
 };
}
export function hasSharedLead(from,to){
 const source=from.shared?.summary?.node,target=sharedCopyNode(to,'summary');
 return !!source&&!!target&&normalized(sharedLead(source).textContent)===normalized(sharedLead(target).textContent);
}
export function hasSharedHeading(from,to){
 const source=from.shared?.title?.node,target=sharedCopyNode(to,'title');
 return !!source&&!!target&&!!normalized(source.textContent)&&normalized(source.textContent)===normalized(target.textContent);
}
// Unshared gallery descriptions fade at their own measured caption slot.
// They never inherit the moving card's layout or interpolate its typography.
export function createStaticCopy(source,shell){
 const node=source.node.cloneNode(true);node.classList.add('flow-shared');
 Object.assign(node.style,{position:'absolute',margin:'0',maxWidth:'none',width:source.rect.width+'px',fontFamily:source.fontFamily,fontSize:source.fontSize+'px',fontWeight:source.fontWeight,lineHeight:String(source.lineHeight||1.5),letterSpacing:(source.letterSpacing||0)+'px',color:source.color,zIndex:'3'});
 shell.append(node);
 return {node,paint(x,y,opacity){Object.assign(node.style,{left:source.rect.left-x+'px',top:source.rect.top-y+'px',opacity:String(opacity*(source.opacity??1))});}};
}
