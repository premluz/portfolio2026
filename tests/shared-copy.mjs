import assert from 'node:assert/strict';
import {captureSharedWords,copyOpacity,copyScale,createSharedWords,hasSharedLead} from '../dist/shared-copy.js';

class Node{
 constructor(){this.style={};this.children=[];}
 append(...children){this.children.push(...children);}
 setAttribute(key,value){this[key]=value;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
}
globalThis.getComputedStyle=node=>({opacity:node.opacity??'1',textTransform:'none',transform:node.transform||'none'});
const measurements={
 createTreeWalker(node){let index=0;return {nextNode:()=>node.walk[index++]||null};},
 createRange(){return {setStart(node){this.node=node;},setEnd(){},getBoundingClientRect(){return this.node.rect;}};}
};
const host=new Node(),part=new Node(),wordSpan=new Node();part.parentElement=host;part.opacity='.8';wordSpan.parentElement=part;wordSpan.opacity='.4';part.ownerDocument=measurements;
part.walk=[{nodeType:1,tagName:'SPAN'},{nodeType:3,textContent:'Clear',parentElement:wordSpan,rect:{left:40,top:50,width:60,height:20}},{nodeType:1,tagName:'BR'},{nodeType:3,textContent:'systems.',parentElement:part,rect:{left:40,top:75,width:80,height:20}}];
const words=captureSharedWords(part,'title');assert.deepEqual(words.map(word=>word.text),['Clear','systems.'],'Explicit line breaks remain separate words');assert.deepEqual(words.map(word=>word.opacity),[.4,1]);assert(Math.abs(copyOpacity(wordSpan,host)-.32)<1e-12,'Group and word opacity are captured independently');
const lead=new Node(),summary=new Node(),context=new Node();summary.querySelector=selector=>selector==='[data-summary-lead]'?lead:null;lead.ownerDocument=measurements;lead.walk=part.walk;lead.textContent='Clear systems.';summary.textContent='Clear systems. Extra context.';
assert.equal(captureSharedWords(summary,'summary').length,2,'Only the common lead participates in word matching');
assert(hasSharedLead({shared:{summary:{node:part}}},{querySelector:()=>summary})===false);
part.textContent='Clear systems.';assert(hasSharedLead({shared:{summary:{node:part}}},{querySelector:()=>summary}));

const matrices={half:{a:.6,b:0,c:0,d:.6},wide:{a:1.2,b:0,c:0,d:.9}};
globalThis.DOMMatrixReadOnly=class{constructor(value){Object.assign(this,matrices[value]);}};
host.transform='half';const parent=new Node();parent.transform='wide';host.parentElement=parent;
const scale=copyScale(part);assert(Math.abs(scale.x-.72)<1e-12&&Math.abs(scale.y-.54)<1e-12,'Carousel/ancestor scaling contributes to the physical type size');delete globalThis.DOMMatrixReadOnly;

globalThis.document={createElement:()=>new Node()};
const targetWords=words.map((word,index)=>({...word,opacity:1,rect:{...word.rect,left:400+index*90,top:140,height:30}}));
const shell=new Node(),proxy=createSharedWords({words,fontFamily:'sans-serif',fontWeight:400},targetWords,summary,'summary',shell);assert(proxy);assert.equal(lead.style.visibility,'hidden');assert.equal(context.style.visibility,undefined,'New context keeps its own reveal');
const item={a:{left:40,top:50},b:{left:400,top:140},scaleA:{x:.72,y:.54},scaleB:{x:1,y:1}};
proxy.paint(item,{x:100,y:100,xPos:220,yPos:95,textP:.5,opacity:.8,fontSize:24,lineHeight:1.4,letterSpacing:0,color:'rgb(20,20,20)',fontWeight:450});
const span=shell.children[0].children[0];assert.equal(span.style.left,'120px');assert.equal(span.style.top,'-5px');assert.equal(span.style.whiteSpace,'pre');assert.equal(span.style.opacity,'0.7');assert.equal(span.style.fontSize,'24px');assert.equal(span.style.fontWeight,450);assert(span.style.transform.startsWith('scaleX('));
assert.equal(createSharedWords({words},[{text:'Different'}],new Node(),'title',shell),null,'Different content uses the ordinary route reveal');
console.log('Shared copy passed: word ranges, explicit line breaks, common lead isolation, partial opacity, scaled ancestors, continuous word placement and differing-content fallback.');
