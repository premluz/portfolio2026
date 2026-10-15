import assert from 'node:assert/strict';
import {flow,RETURN_EXIT_FADE,RETURN_EXIT_STAGGER} from '../dist/liquid-surface.js';
import {TransitionControl} from '../dist/transition-control.js';
import {colorChannels} from '../dist/surface-colors.js';
import {materialSettings} from '../dist/material-settings.js';
import {captureSharedWords} from '../dist/shared-copy.js';
import {SummaryStream} from '../dist/summary-stream.js';

// Run the production morph and its reversible clock with measured text slots.
// No image renderer is needed to check the typography handoff.
class Node {
 constructor(kind='div',rect={left:40,top:40,width:500,height:420}){
  this.kind=kind;this.rect=rect;this.children=[];this.isConnected=true;
  this.style={setProperty(key,value){this[key]=value;},removeProperty(key){delete this[key];},getPropertyValue(key){return this[key]||'';}};
  this.classes=new Set();this.classList={add:name=>this.classes.add(name),contains:name=>this.classes.has(name)};
 }
 append(...nodes){this.children.push(...nodes);}
 setAttribute(key,value){this[key]=value;}
 cloneNode(){const node=new Node(this.kind,this.rect);node.computed=this.computed;node.textContent=this.textContent;node.dataset={...this.dataset};node.append(...this.children.map(child=>child.cloneNode()));return node;}
 querySelector(selector){return selector==='.card-copy'?this.children.find(child=>child.kind==='copy')||null:selector==='[data-gallery-description]'||(selector==='.project-summary'||selector==='.project-summary,.info-summary')?this.children.find(child=>child.kind==='summary')||null:selector==='[data-gallery-title]'||selector==='h1'||selector==='h1,h2'?this.children.find(child=>child.kind==='heading')||null:selector==='[data-gallery-client]'||selector==='.project-client'||selector==='.card-client,.project-client'?this.children.find(child=>child.kind==='client')||null:null;}
 querySelectorAll(){return [];}
 getBoundingClientRect(){return this.rect;}
 remove(){this.isConnected=false;}
 animate(){return {finished:Promise.resolve()};}
}
let frames=[];
globalThis.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
globalThis.getComputedStyle=node=>({...node.computed||{backgroundColor:'rgb(240,240,239)',borderTopLeftRadius:'40px'},opacity:node.style.opacity||node.computed?.opacity||'1'});
globalThis.cancelAnimationFrame=()=>{};

async function scenario({fromLine=1.13,toLine=1.3,sourceHidden=false,targetHidden=false,targetCopyHidden=false,reverseAt=null,intensity=0,glowStrength=25,sourceGradient=null,targetGradient=null,words=false,sourceOpacity=1,fadeEntry=false,externalCaption=false,returnCaption=false,differentHeading=false,chatEntry=false,chatReturn=false}){
 frames=[];const body=new Node();globalThis.document={body,createElement:()=>new Node()};
 const source=new Node(),destination=new Node('div',{left:60,top:40,width:1100,height:700});
 const heading=new Node('heading',{left:100,top:100,width:270,height:70});source.append(heading);
 if(sourceOpacity!==1)heading.dataset={revealOpacity:String(sourceOpacity)};
 const target=new Node('heading',{left:100,top:140,width:320,height:96});
 const targetCopy=new Node('copy');targetCopy.computed={opacity:targetCopyHidden?'0':'1',visibility:'visible'};target.closest=selector=>selector==='.card-copy'?targetCopy:null;
 target.computed={fontSize:'40px',lineHeight:toLine*40+'px',letterSpacing:'-1px',color:'rgb(20,20,20)',visibility:targetHidden?'hidden':'visible'};
 if(words){
  const measurement={createTreeWalker:node=>{let i=0;return {nextNode:()=>node.texts?.[i++]||null};},createRange:()=>({setStart(node){this.node=node;},setEnd(){},getBoundingClientRect(){return this.node.rect;}})};
  for(const [node,rects] of [[heading,[{left:100,top:100,width:130,height:35},{left:240,top:100,width:120,height:35}]],[target,[{left:100,top:140,width:175,height:46},{left:100,top:192,width:160,height:46}]]]){
   node.ownerDocument=measurement;node.texts=['Content ','Pipeline'].map((text,index)=>({nodeType:3,textContent:text,parentElement:node,rect:rects[index]}));
  }
 }
 destination.append(target);if(chatEntry)source.closest=selector=>selector==='.ask-cards'?{}:null;if(chatReturn)destination.closest=selector=>selector==='.ask-cards'?{}:null;
 const client=new Node('client',{left:60,top:100,width:60,height:20}),targetClient=new Node('client',{left:100,top:108,width:120,height:22});
 targetClient.computed={fontSize:'16px',lineHeight:'22px',letterSpacing:'0px',color:'rgb(90,90,90)',visibility:targetHidden?'hidden':'visible'};
 source.append(client);destination.append(targetClient);
 let reveal,paragraph;
 if(fadeEntry){heading.textContent='Content Pipeline';target.textContent=differentHeading?'Transformation saving hundreds of hours':'Content Pipeline';client.textContent=targetClient.textContent='PlayStation';paragraph=new Node('summary');paragraph.dataset={};paragraph.textContent='The longer project description.';paragraph.closest=()=>destination;destination.append(paragraph);reveal=new SummaryStream(paragraph,{mode:'fade',paused:true});assert.equal(target.style.opacity,'0');assert.equal(targetClient.style.opacity,'0');}
 if(externalCaption){const caption=new Node('caption');caption.append(heading,client);source.children=[];source.morphCopyRoot=caption;}
 let captionDescription;
 if(returnCaption||chatReturn){heading.textContent=target.textContent='Content Pipeline';const nativeCopy=new Node('copy');nativeCopy.append(target.cloneNode(),targetClient.cloneNode(),new Node('summary'));destination.children=[nativeCopy];const caption=new Node('caption');captionDescription=new Node('summary',{left:100,top:620,width:800,height:54});captionDescription.textContent='End-to-end design across 0 → 1 → Growth and continuous improvements';captionDescription.computed={fontFamily:'sans-serif',fontSize:'18px',fontWeight:'400',lineHeight:'27px',letterSpacing:'0px',color:'rgb(90,90,90)'};caption.append(target,targetClient,captionDescription);if(chatReturn)destination.children=[target,targetClient,captionDescription,nativeCopy];else destination.morphCopyRoot=caption;}
 destination.computed={backgroundColor:'rgb(240,240,239)',backgroundImage:targetGradient||'none',borderTopLeftRadius:'40px'};
 const snapshot={element:source,clone:source.cloneNode(),rect:source.rect,radius:40,background:'rgb(240,240,239)',backgroundImage:sourceGradient||'none',shared:{title:{node:heading,rect:heading.rect,fontSize:30,fontFamily:'sans-serif',fontWeight:'400',lineHeight:fromLine,letterSpacing:-.9,color:'rgb(20,20,20)',hidden:sourceHidden}}};
 if(returnCaption||chatReturn){const long=new Node('summary');long.textContent='The longer project description.';snapshot.shared.summary={node:long,rect:long.rect,fontSize:18,fontFamily:'sans-serif',fontWeight:'400',lineHeight:1.5,letterSpacing:0,color:'rgb(90,90,90)'};}
 snapshot.copyRoot=source.morphCopyRoot;
 snapshot.shared.title.opacity=sourceOpacity;
 if(words)snapshot.shared.title.words=captureSharedWords(heading,'title');
 snapshot.shared.client={node:client,rect:client.rect,fontSize:14,fontFamily:'sans-serif',fontWeight:'400',lineHeight:1.4,letterSpacing:0,color:'rgb(90,90,90)',hidden:sourceHidden};
 const control=new TransitionControl();control.synchronize(400);
 materialSettings.glow=glowStrength;
 const done=flow(snapshot,destination,{duration:400,intensity,control});
 assert.equal(destination.style.opacity,'0','The destination is unpainted from the first synchronous line of the morph, before any decode or video wait');
 if(fadeEntry){if(!differentHeading&&!externalCaption&&!chatEntry){assert.equal(target.style.opacity,'','Shared title is not classified as a hidden destination');assert.equal(targetClient.style.opacity,'');}else{assert.equal(target.style.opacity,'0','A new page thesis stays in the header-first fade');assert.equal(targetClient.style.opacity,'0');}assert.equal(paragraph.style.opacity,'0','Paragraph still uses its separate stagger reveal');reveal.start();}
 assert.equal(source.style.opacity,'0','Only the moving copy is visible after detaching from the live source');
 assert.equal(destination.style.opacity,'0','The docking slot is blank while the moving copy approaches it');
 const stages=body.children.filter(node=>node.className==='motion-viewport');
 const wake=stages.flatMap(node=>node.children).find(node=>node.className==='motion-afterglow');
 const shell=stages.flatMap(node=>node.children).find(node=>node.className==='flow-shell');
 const material=shell.children.find(node=>node.className==='flow-material');
 const animatedHeading=shell.children.find(node=>node.kind==='heading'&&node.classes.has('flow-shared')&&!node.classes.has('flow-caption-out')&&!node.classes.has('flow-caption-in'));
 const descriptionProxy=returnCaption||chatReturn?shell.children.find(node=>node.kind==='summary'&&node.classes.has('flow-caption-in')):null;
 if(returnCaption){assert(descriptionProxy);const incomingCopy=shell.children.find(node=>node.classes.has('flow-content')&&node.querySelector('.card-copy'));assert.equal(incomingCopy.querySelector('.card-copy').style.display,'none','Detached gallery clones cannot reveal the internal duplicate description');}
 const animatedClient=shell.children.find(node=>node.kind==='client'&&node.classes.has('flow-shared')&&!node.classes.has('flow-caption-out')&&!node.classes.has('flow-caption-in'));
 if(differentHeading||externalCaption||returnCaption||chatEntry||chatReturn){
  assert(!animatedHeading&&!animatedClient,'Gallery text never travels between the page header and caption');
  const incoming=fadeEntry?shell.children.find(node=>node.classes.has('flow-content')&&node!==snapshot.clone&&node.querySelector('h1')?.textContent===target.textContent):null,nativeHeading=incoming?.querySelector('h1');
  const captions=shell.children.filter(node=>node.classes.has('flow-caption-out')||node.classes.has('flow-caption-in'));
  let headerLeads=false,reversed=false,staggered=false;
  for(let time=0;frames.length&&time<2000;time+=16){
   frames.shift()(time);
   if(!control.timeline.finished&&nativeHeading)assert.equal(nativeHeading.style.opacity,target.style.opacity,'Native detail heading tracks the live stagger');
   for(const copy of captions)if(copy.style.left!==undefined){assert.equal(parseFloat(copy.style.left)+parseFloat(shell.style.left),copy.rect.left,'Caption text holds its screen position while the image moves');assert.equal(parseFloat(copy.style.top)+parseFloat(shell.style.top),copy.rect.top);}
   if(returnCaption||chatReturn){const copies=captions.filter(node=>node.classes.has('flow-caption-in')),company=copies.find(node=>node.kind==='client'),title=copies.find(node=>node.kind==='heading'),description=copies.find(node=>node.kind==='summary');if(company.style.opacity!==undefined){assert(Number(company.style.opacity)>=Number(title.style.opacity));assert(Number(title.style.opacity)>=Number(description.style.opacity));if(Number(company.style.opacity)>Number(title.style.opacity))staggered=true;}}
   if(returnCaption){const value=control.timeline.value,blocks=[...snapshot.clone.children].filter(node=>node.style.opacity!==undefined).sort((p,q)=>p.getBoundingClientRect().top-q.getBoundingClientRect().top||p.getBoundingClientRect().left-q.getBoundingClientRect().left),fade=start=>Math.max(0,Math.min(1,1-(value-start)/RETURN_EXIT_FADE));assert(!captions.some(node=>node.classes.has('flow-caption-out')),'A settled return keeps the detail heading in its page instead of pinning a static copy');assert(blocks.length,'Detail blocks exit individually');assert(Math.abs(Number(blocks[0].style.opacity)-fade(0))<1e-9&&Math.abs(Number(blocks.at(-1).style.opacity)-fade(RETURN_EXIT_STAGGER))<1e-9,'All text starts leaving on the first frame');if(RETURN_EXIT_STAGGER===0)assert(blocks.every(node=>node.style.opacity===blocks[0].style.opacity),'Text fades out at once');else for(let k=1;k<blocks.length;k++)assert(Number(blocks[k-1].style.opacity)<=Number(blocks[k].style.opacity),'Exit staggers top to bottom');if(value>0)assert(Number(blocks[0].style.opacity)<1,'The exit begins immediately');if(value>=RETURN_EXIT_FADE+RETURN_EXIT_STAGGER)assert(blocks.every(node=>Number(node.style.opacity)===0),'The whole exit finishes early, faster than the entry reveal');for(let k=1;k<blocks.length;k++)assert(Number(blocks[k-1].style.opacity)<=Number(blocks[k].style.opacity),'Exit staggers top to bottom');{const [dx,dy]=(snapshot.clone.style.transform.match(/-?[\d.]+(?=px)/g)||[]).map(Number);assert(Math.abs(dx-(snapshot.rect.left-parseFloat(shell.style.left))*.12)<1e-6&&Math.abs(dy-(snapshot.rect.top-parseFloat(shell.style.top))*.12)<1e-6,'The detail page drifts with the morph like the reversed entry');}}
   if(fadeEntry&&Number(target.style.opacity)>Number(paragraph.style.opacity)&&Number(target.style.opacity)<1)headerLeads=true;
   if(reverseAt!==null&&!reversed&&control.timeline.value>=reverseAt){control.reverse();reversed=true;}
  }
  await done;if(fadeEntry)assert(headerLeads,'Header leads the detail paragraph');if((returnCaption||chatReturn)&&(reverseAt===null||reverseAt>=.35))assert(staggered,'Carousel company, title and description stagger in independently');assert(!source.style.visibility&&!source.style.opacity);assert(!destination.style.visibility&&!destination.style.opacity);assert(stages.every(node=>!node.isConnected));reveal?.destroy();return;
 }
 const textProxy=shell.children.find(node=>node.className==='flow-shared-words');
 if(words){assert(textProxy);assert.equal(animatedHeading.style.visibility,'hidden','The reflowing native copy cannot duplicate the shared words');assert.equal(textProxy.children.length,2);}
 assert(animatedClient,'Client metadata uses the real shared card-to-detail morph');
 const samples=[];let reversed=false;
 for(let time=0;frames.length&&time<2000;time+=16){
  frames.shift()(time);
  if(returnCaption){assert.equal(parseFloat(descriptionProxy.style.left)+parseFloat(shell.style.left),captionDescription.rect.left,'Description stays in its caption slot while the image moves');assert.equal(parseFloat(descriptionProxy.style.top)+parseFloat(shell.style.top),captionDescription.rect.top);assert.equal(descriptionProxy.style.fontSize,'18px');}
  samples.push({line:Number(animatedHeading.style.lineHeight),font:parseFloat(animatedHeading.style.fontSize),glow:Number(wake.style.opacity),opacity:Number(animatedHeading.style.opacity),word:words?{left:parseFloat(textProxy.children[1].style.left)+parseFloat(shell.style.left),top:parseFloat(textProxy.children[1].style.top)+parseFloat(shell.style.top)}:null});
  if(reverseAt!==null&&!reversed&&control.timeline.value>=reverseAt){control.reverse();reversed=true;}
 }
 await done;
 assert(!source.style.visibility&&!source.style.opacity,'A retained Chat/source card is revealed after opening and Escape, so its image remains visible on return');
 assert(!destination.style.visibility&&!destination.style.opacity,'The live docking card is restored on completion and reversal, ready for another return');
 assert(stages.every(node=>!node.isConnected),'Opening and Escape both remove their temporary viewports');
 if(sourceGradient&&targetGradient){
  const expected=(reverseAt===null?targetGradient:sourceGradient).match(/oklch\([^)]*\)/g).map(colorChannels);
  const actual=material.style.background.match(/rgba\([^)]*\)/g).map(colorChannels);
  actual.forEach((color,i)=>color.forEach((channel,j)=>assert(Math.abs(channel-expected[i][j])<.01,'Morph hands off both gradient stops continuously')));
 }
 if(fadeEntry){assert(samples.every(sample=>sample.opacity===1),'The visible heading travels continuously instead of fading away and popping back');assert.equal(animatedClient.style.opacity,'1');reveal.destroy();}
 assert(samples.length>3,'Production morph rendered intermediate frames');
 const peakGlow=Math.max(...samples.map(sample=>sample.glow));
 if(!intensity||!glowStrength)assert.equal(peakGlow,0,'Disabling intensity or afterglow removes the transition wake');
 else assert(peakGlow>0&&peakGlow<=glowStrength/100,'The wake respects the Afterglow control');
 if(reverseAt===null)assert(samples.at(-1).glow<.001,'The afterglow is gone by landing, so it never hazes the settled media');
 assert.equal(samples[0].line,fromLine,'First frame matches the actual source heading');
 if(sourceHidden&&(targetHidden||targetCopyHidden))assert(samples.every(sample=>sample.opacity===0),'Copy hidden at both ends stays hidden throughout the handoff');
 const end=samples.at(-1);
 assert(Math.abs(end.line-(reversed?fromLine:toLine))<1e-12,'Last overlay frame matches the receiving heading, before it becomes visible');
 assert.equal(end.font,reversed?30:40);
 if(sourceOpacity!==1){assert.equal(samples[0].opacity,sourceOpacity,'An early close starts at the visible opacity, rather than applying the old reveal twice');assert.equal(end.opacity,reversed?sourceOpacity:1);}
 if(words){assert.deepEqual(samples[0].word,{left:240,top:100},'First shared word frame is its real card position');assert.deepEqual(end.word,reversed?{left:240,top:100}:{left:100,top:192},'Words land exactly on the receiving line, including reversal');assert(samples.some(sample=>sample.word.top>100&&sample.word.top<192),'Line wrapping changes by continuous word travel');}
 assert.equal(parseFloat(animatedClient.style.fontSize),reversed?14:16,'Client typography lands on its receiving style, including reversal');
 assert.equal(parseFloat(animatedClient.style.top),(reversed?client.rect.top:targetClient.rect.top)-(reversed?source.rect.top:destination.rect.top),'Client label lands above the receiving title without popping in after the morph');
 for(let i=1;i<samples.length;i++){
  assert(Number.isFinite(samples[i].line));
  assert(Math.abs(samples[i].line-samples[i-1].line)<.04,'Line spacing changes continuously, including the final frame');
 }
}
await scenario({});
await scenario({fromLine:1.3,toLine:1.13});
await scenario({sourceHidden:true});
await scenario({fromLine:1.3,toLine:1.13,targetHidden:true});
await scenario({sourceHidden:true,targetCopyHidden:true});
for(const reverseAt of [.12,.4,.8])await scenario({reverseAt});
await scenario({sourceHidden:true,reverseAt:.6});
await scenario({intensity:1,glowStrength:0});
await scenario({intensity:1,glowStrength:25});
const gradients={sourceGradient:'linear-gradient(155deg in oklab,oklch(.93 .045 265),oklch(.93 .045 310))',targetGradient:'linear-gradient(155deg in oklab,oklch(.235 .018 265),oklch(.235 .018 310))'};
await scenario(gradients);
await scenario({...gradients,reverseAt:.5});
await scenario({words:true});
for(const reverseAt of [.12,.4,.8])await scenario({words:true,reverseAt});
await scenario({words:true,sourceOpacity:.45});
await scenario({words:true,sourceOpacity:.45,reverseAt:.4});
await scenario({fadeEntry:true,externalCaption:true});
for(const reverseAt of [.12,.4,.8])await scenario({fadeEntry:true,externalCaption:true,reverseAt});
await scenario({fadeEntry:true,externalCaption:true,differentHeading:true});
for(const reverseAt of [.12,.4,.8])await scenario({fadeEntry:true,externalCaption:true,differentHeading:true,reverseAt});
await scenario({returnCaption:true});
for(const reverseAt of [.12,.4,.8])await scenario({returnCaption:true,reverseAt});
await scenario({fadeEntry:true,chatEntry:true});
await scenario({chatReturn:true});
for(const reverseAt of [.12,.4,.8]){await scenario({fadeEntry:true,chatEntry:true,reverseAt});await scenario({chatReturn:true,reverseAt});}
materialSettings.glow=25;
console.log('Shared heading and afterglow passed: continuous line height, hidden copy handoffs, and Escape at three phases.');
