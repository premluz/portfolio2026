import {attachSummaryStream,attachTitleReveal,setSummaryProgress,preserveSharedLead,preserveSharedHeading} from './summary-stream.js';
import {captureSharedWords,createSharedWords,createStaticCopy,copyOpacity,copyScale,hasSharedLead,hasSharedHeading,sharedCopyNode} from './shared-copy.js';
import {EdgeSpring,edgeTargets,materialSettings,imageEffects,springParameters,motionTrail,easeMaterial} from './material-settings.js';
import {pulseImages,LiquidImage,getLiquidImage} from './liquid-image.js';
import { ReversibleProgress,morphProgress } from './transition-control.js';
import {readImagePadding,readFrameRadius} from './image-frame.js';
import {colorInterpolator,gradientInterpolator} from './surface-colors.js';
import {stageMotion} from './motion-viewport.js';
import {hideMorphSource} from './morph-visibility.js';
import {bindDetailContentReveal} from './detail-content-reveal.js';
import {sameImageAsset,ImageDecodeGate,handoffImage} from './image-handoff.js';
// Broad, continuous contour deformation. No noise displacement of DOM content.
export function contour(w,h,r,amount=0,phase=0){
 r=Math.min(r,w*.22,h*.22);const a=Math.min(w,h)*.052*amount;
 const top=a*(.7+.3*Math.sin(phase)),right=a*(.7+.3*Math.cos(phase)),bottom=a*.75,left=a*.5;
 return `M ${r} 0 C ${w*.32} ${top},${w*.66} ${-top*.25},${w-r} 0 Q ${w} 0,${w} ${r} C ${w-right} ${h*.34},${w+right*.2} ${h*.65},${w} ${h-r} Q ${w} ${h},${w-r} ${h} C ${w*.65} ${h-bottom},${w*.33} ${h+bottom*.2},${r} ${h} Q 0 ${h},0 ${h-r} C ${left} ${h*.65},${-left*.2} ${h*.33},0 ${r} Q 0 0,${r} 0 Z`;
}
const lerp=(a,b,t)=>a+(b-a)*t;
const captionEase=value=>{const q=Math.max(0,Math.min(1,value));return q*q*(3-2*q);};
export async function flow(from,to,{duration,intensity,control,ambientGlow=false,ambientLight=null}){
 const galleryEntry=!!from.copyRoot,galleryReturn=!!to.morphCopyRoot,chatEntry=!!from.element?.closest?.('.ask-cards'),chatReturn=!!to.closest?.('.ask-cards'),independentEntry=galleryEntry||chatEntry,independentReturn=galleryReturn||chatReturn,independentCopy=independentEntry||independentReturn;
 const newDetailHeading=!!to.querySelector('h1')&&(independentEntry||!!from.shared?.title?.node?.textContent?.trim()&&!hasSharedHeading(from,to));
 if(!independentCopy&&hasSharedHeading(from,to))preserveSharedHeading(to.querySelector('.project-summary'));
 if(!independentCopy&&hasSharedLead(from,to))preserveSharedLead(to.querySelector('.project-summary'));
 const a=from.rect,b=to.getBoundingClientRect();
 const shell=document.createElement('div');shell.className='flow-shell';
 const bg=from.background||getComputedStyle(to).backgroundColor,targetStyle=getComputedStyle(to.querySelector(':scope > .liquid-skin')||to),targetBackground=targetStyle.backgroundColor;
 shell.style.background='none';const material=document.createElement('div');material.className='flow-material';material.style.background=from.backgroundImage&&from.backgroundImage!=='none'?from.backgroundImage:bg;shell.append(material);
 const blendBackground=gradientInterpolator(from.backgroundImage,targetStyle.backgroundImage,bg,targetBackground);
 const incoming=to.cloneNode(true);incoming.querySelectorAll('canvas,video').forEach(c=>c.remove());incoming.classList.add('flow-content');Object.assign(incoming.style,{width:b.width+'px',height:b.height+'px',background:'none',boxShadow:'none',filter:'none',margin:'0',opacity:'0'});
 const outgoing=from.clone;outgoing.classList.add('flow-content');outgoing.querySelectorAll('.visual').forEach(v=>v.style.visibility='hidden');Object.assign(outgoing.style,{width:a.width+'px',height:a.height+'px',background:'none',boxShadow:'none',filter:'none',margin:'0'});
 // Detached gallery clones no longer have the ancestor selector that hides
 // their internal card copy. The visible caption is its sole text source.
 for(const [external,clone] of [[from.copyRoot,outgoing],[to.morphCopyRoot,incoming]])if(external){const copy=clone.querySelector('.card-copy');if(copy)copy.style.display='none';}
 if(chatEntry){const copy=outgoing.querySelector('.card-copy');if(copy)copy.style.visibility='hidden';}
 if(chatReturn){const copy=incoming.querySelector('.card-copy');if(copy)copy.style.visibility='hidden';}
 const captionKeys=['client','title','summary'],sourceCaptions=[],targetCaptions=[];
 if(independentCopy)for(const [index,key] of captionKeys.entries()){
  const source=from.shared?.[key];if(source){const copy=createStaticCopy({...source,opacity:source.hidden?0:source.opacity},shell);copy.node.classList.add('flow-caption-out');sourceCaptions.push({copy,index});const native=outgoing.querySelector(key==='title'?'h1,h2':key==='client'?'.card-client,.project-client':'.project-summary,.info-summary');if(native)native.style.visibility='hidden';}
  const target=independentReturn?sharedCopyNode(to,key):null;if(target){const style=getComputedStyle(target),copy=createStaticCopy({node:target,rect:target.getBoundingClientRect(),opacity:copyOpacity(target,to),fontFamily:style.fontFamily,fontSize:parseFloat(style.fontSize),fontWeight:style.fontWeight,lineHeight:parseFloat(style.lineHeight)/parseFloat(style.fontSize),letterSpacing:parseFloat(style.letterSpacing)||0,color:style.color},shell);copy.node.classList.add('flow-caption-in');targetCaptions.push({copy,index});}
 }
 const paintIncomingFacts=bindDetailContentReveal(to,incoming),paintOutgoingFacts=bindDetailContentReveal(from.element,outgoing);
 // Shared headings morph from their real card slots, including labels hidden at rest.
 const detachSummary=attachSummaryStream(to.querySelector('.project-summary'),incoming.querySelector('.project-summary'));
 const detachHeadingReveal=newDetailHeading?[incoming.querySelector('h1'),incoming.querySelector('.project-client')].map(node=>attachTitleReveal(to.querySelector('.project-summary'),node)):[];
 const shared=[];
 for(const [key,selector] of [['title','h1,h2'],['client','.card-client,.project-client'],['category','.eyebrow'],['summary','.project-summary,.info-summary']]){
 const source=from.shared?.[key],target=sharedCopyNode(to,key);if(!source||!target)continue;
 if(independentCopy)continue;
 // The page thesis is new content, not the outcome sentence on the card.
 // Its native header follows the same leading fade as project-to-project entry.
 if(newDetailHeading&&(key==='title'||key==='client'))continue;
 // Card results and the longer project introduction are separate content.
 // Let differing paragraphs use the normal crossfade and streaming reveal.
 if(key==='summary'&&!hasSharedLead(from,to))continue;
 const fadeReveal=to.querySelector('.project-summary')?.dataset?.revealMode==='fade';
 const node=(fadeReveal?target:source.node).cloneNode(true),rect=target.getBoundingClientRect(),style=getComputedStyle(target),targetCopy=to.morphCopyRoot?null:target.closest?.('.card-copy'),targetCopyStyle=targetCopy?getComputedStyle(targetCopy):null;
 if(node.dataset)delete node.dataset.revealOpacity;
 const context=key==='summary'?target.querySelector('[data-summary-context]'):null;
 if(context&&!node.querySelector('[data-summary-context]'))node.append(context.cloneNode(true));
 const detachStream=key==='summary'?attachSummaryStream(target,node):(key==='title'||key==='client')?attachTitleReveal(to.querySelector('.project-summary'),node):()=>{};
 const closingSummary=key==='summary'&&!context&&!!node.querySelector('[data-summary-context]');
 const summaryStart=Number(source.node.dataset?.summaryProgress??1);
 const lineA=Number.isFinite(source.lineHeight)?source.lineHeight:1.2,targetLine=parseFloat(style.lineHeight)/parseFloat(style.fontSize),lineB=Number.isFinite(targetLine)?targetLine:1.2;
 node.classList.add('flow-shared');Object.assign(node.style,{position:'absolute',margin:'0',maxWidth:'none',fontFamily:source.fontFamily,fontWeight:source.fontWeight,lineHeight:lineA,color:source.color,zIndex:'3',opacity:source.hidden?'0':'1'});
 const outgoingCopy=outgoing.querySelector(selector),incomingCopy=incoming.querySelector(selector);if(outgoingCopy)outgoingCopy.style.visibility='hidden';if(incomingCopy)incomingCopy.style.visibility='hidden';shell.append(node);
 const words=createSharedWords(source,captureSharedWords(target,key),node,key,shell);
 const scaleB=copyScale(target);
 shared.push({node,words,detachStream,closingSummary,summaryStart,a:source.rect,b:rect,scaleA:source.scale,scaleB,fontA:source.fontSize,fontB:parseFloat(style.fontSize)*scaleB.y,weightA:parseFloat(source.fontWeight)||400,weightB:parseFloat(style.fontWeight)||400,opacityA:source.opacity??1,opacityB:copyOpacity(target,to),lineA,lineB,spacingA:source.letterSpacing,spacingB:(parseFloat(style.letterSpacing)||0)*scaleB.y,blendColor:colorInterpolator(source.color,style.color),sourceHidden:source.hidden,targetHidden:style.visibility==='hidden'||Number(style.opacity)===0||!!targetCopyStyle&&(targetCopyStyle.visibility==='hidden'||Number(targetCopyStyle.opacity)===0),revealOrigin:null});
 }
 const targetVisual=to.querySelector('.visual');let picture=null,nextPicture=null,nextImageGate=null,iv=null;
 if(from.image&&targetVisual){iv=targetVisual.getBoundingClientRect();picture=document.createElement('div');picture.className='visual flow-picture';const img=document.createElement('img');if(from.image.originalSrc)img.dataset.originalImage=from.image.originalSrc;for(const key of ['width','height'])if(from.image['original'+key[0].toUpperCase()+key.slice(1)])img.setAttribute(key,from.image['original'+key[0].toUpperCase()+key.slice(1)]);img.src=from.image.src;img.alt='';picture.append(img);picture.style.backgroundColor='transparent';if(Number.isFinite(from.image.rounding))picture.style.setProperty('--image-rounding',from.image.rounding+'px');picture.style.setProperty('--image-overlay',String(from.image.shade||0));picture.style.setProperty('--image-shade-height',(from.image.shadeHeight||0)+'px');picture.style.setProperty('--image-size-limit',String(from.image.sizeLimit??1));for(const side of ['top','right','bottom','left'])picture.style.setProperty('--image-padding-'+side,(from.image.padding?.[side]||0)+'px');Object.assign(picture.style,{left:from.image.rect.left-a.left+'px',top:from.image.rect.top-a.top+'px',width:from.image.rect.width+'px',height:from.image.rect.height+'px',borderRadius:from.image.radius+'px'});incoming.querySelector('.visual').style.visibility='hidden';const targetImage=targetVisual.querySelector('img'),nextSrc=targetImage?.currentSrc||targetImage?.src;if(nextSrc&&!sameImageAsset(from.image,targetImage)){nextPicture=picture.cloneNode(true);const nextImage=nextPicture.querySelector('img');nextImage.dataset.originalImage=targetImage.dataset?.originalImage||nextSrc;for(const key of ['width','height']){const value=targetImage.getAttribute(key);if(value)nextImage.setAttribute(key,value);else nextImage.removeAttribute(key);}nextImage.src=nextSrc;nextPicture.style.opacity='0';nextImageGate=new ImageDecodeGate(nextImage);}}
 // Keep the live source painted until its cached moving copy can paint too.
 // This only awaits an image that was already visible, never the larger target.
 if(from.image?.loaded&&picture?.querySelector('img')?.decode)try{await picture.querySelector('img').decode();}catch{}
 const movingAmbient=ambientLight?.beginMorph(shell,from,to);
 const keepAmbient=!movingAmbient&&ambientGlow&&from.image&&targetVisual&&(from.element?.matches?.('.detail')||to.matches?.('.detail'));
 const ambient=keepAmbient?document.createElement('div'):null;
 const ambientSource=from.image?.contentRect||from.image?.rect;
 const ambientTarget=targetVisual?.querySelector('img')?.getBoundingClientRect()||iv;
 const ambientStart=Number(!!from.ambientActive);
 const ambientEnd=Number(!!to.querySelector(':scope > .surface-effect-layer.is-active'));
 if(ambient){
  // The live detail already has a persistent glow. Its transition clone must
  // carry content only, or that copied glow stacks with this moving field.
  incoming.querySelectorAll('.surface-effect-layer').forEach(layer=>layer.remove());
  const hues=getComputedStyle(to);shell.dataset.hoverEffect='glow';for(const key of ['--project-hue-start','--project-hue-end'])shell.style.setProperty(key,hues.getPropertyValue(key));ambient.className='surface-effect-layer is-active';shell.append(ambient);
 }
 if(movingAmbient)incoming.querySelectorAll('.surface-effect-layer').forEach(layer=>layer.remove());
 shell.append(outgoing,incoming);if(picture)shell.append(picture);if(nextPicture)shell.append(nextPicture);const fields=document.createElement('div');fields.className='material-reflection';fields.style.transform=from.reflectionTransform||'';material.append(fields);const glow=document.createElement('div');glow.className='motion-afterglow';const removeGlowViewport=keepAmbient||movingAmbient?()=>{}:stageMotion(glow,19),removeShellViewport=stageMotion(shell,25);const restoreTarget=hideMorphSource(to),restoreSource=hideMorphSource(from.element!==to?from.element:null),restoreSourceCopy=hideMorphSource(from.copyRoot),restoreTargetCopy=hideMorphSource(to.morphCopyRoot);try{const imageRenderers=[picture,nextPicture].filter(Boolean).map(el=>new LiquidImage(el,()=>intensity,{fixedResolution:[Math.max(from.image.rect.width,iv.width),Math.max(from.image.rect.height,iv.height)]}));
 const r0=from.radius??64,r1=parseFloat(getComputedStyle(to).borderTopLeftRadius)||0;
 const targetFrameRadius=targetVisual?readFrameRadius(targetVisual):0,targetImage=targetVisual?.querySelector('img'),targetImageRounding=targetImage?parseFloat(getComputedStyle(targetImage).borderTopLeftRadius)||0:0;
 const targetPadding=targetVisual?readImagePadding(targetVisual):{},targetSizeLimit=targetVisual?(parseFloat(getComputedStyle(targetVisual).getPropertyValue('--image-size-limit'))||1):1,targetBacking=targetVisual?getComputedStyle(targetVisual).backgroundColor:'transparent';
 const blendImageBacking=gradientInterpolator(from.image?.backingGradient,targetVisual?getComputedStyle(targetVisual).backgroundImage:null,from.image?.backing||'transparent',targetBacking);
 const targetCardCopy=!to.morphCopyRoot&&to.classList.contains('image-card')?to.querySelector(':scope > .card-copy'):null,targetCardCopyStyle=targetCardCopy?getComputedStyle(targetCardCopy):null,targetLabelsHidden=!!targetCardCopyStyle&&(targetCardCopyStyle.visibility==='hidden'||Number(targetCardCopyStyle.opacity)===0);
 const targetShadeHeight=targetVisual&&!targetLabelsHidden?parseFloat(getComputedStyle(targetVisual).getPropertyValue('--image-shade-height'))||0:0;
 const targetShade=targetVisual&&!targetLabelsHidden?Number(getComputedStyle(targetVisual).getPropertyValue('--image-overlay'))||0:0;
 // Begin while travelling, with enough wave left to flow through the handoff.
 // Long slow-motion journeys use the last 900ms; quick ones start at 18%.
 const rippleAt=Math.max(.18,1-900/duration);let rippleStarted=false;
 const timeline=control?.timeline||new ReversibleProgress(duration);if(!control?.timeline)control?.register(()=>timeline.reverse());const trail=[];const leftEdge=new EdgeSpring(),rightEdge=new EdgeSpring(),cornerLeft=new EdgeSpring(),cornerRight=new EdgeSpring();const reflectionSpring=new EdgeSpring();if(from.reflectionTransform&&from.reflectionTransform!=='none')reflectionSpring.position=new DOMMatrixReadOnly(from.reflectionTransform).m41;const imageMotion={x:from.image?.motion?.x||0,y:from.image?.motion?.y||0};for(const image of imageRenderers)image.setMotion(imageMotion.x,imageMotion.y);cornerLeft.position=from.cornerRadii?.left??r0;cornerRight.position=from.cornerRadii?.right??r0;let previousGeometry=null,previousImage=null,previousFrame=null;await new Promise(resolve=>{function frame(now){paintIncomingFacts();paintOutgoingFacts();const t=control?.timeline?control.advance(now):timeline.step(now),p=morphProgress(t),wave=Math.sin(Math.PI*t)*Math.pow(1-t,.35)*intensity;
 if(!rippleStarted&&(t>=rippleAt||timeline.direction<0)){rippleStarted=true;for(const image of imageRenderers)image.pulse(1.3);}
 const x=lerp(a.left,b.left,p),y=lerp(a.top,b.top,p),w=lerp(a.width,b.width,p),h=lerp(a.height,b.height,p),r=lerp(r0,r1,p)+wave*18;
 Object.assign(shell.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});for(const {copy,index} of sourceCaptions)copy.paint(x,y,1-captionEase((t*(galleryReturn?2:1)-(2-index)*.07)/.26));for(const {copy,index} of targetCaptions)copy.paint(x,y,captionEase((t-.35-index*.07)/.32));trail.push({now,x,y,w,h,r});while(trail.length>1&&now-trail[0].now>95)trail.shift();const lag=trail[0];Object.assign(glow.style,{left:lag.x+'px',top:lag.y+'px',width:lag.w+'px',height:lag.h+'px',borderRadius:lag.r+'px',opacity:String(Math.min(1,t*6)*(.22+Math.sin(Math.PI*t)*.4)*materialSettings.glow/100*intensity)});const dt=previousFrame?Math.min(1.5,(now-previousFrame)/16.667):1;previousFrame=now;const speedL=previousGeometry?(x-previousGeometry.x)/(dt*16.667):0,speedR=previousGeometry?(x+w-previousGeometry.x-previousGeometry.w)/(dt*16.667):0;previousGeometry={x,y,w};const {k,damper}=springParameters(materialSettings);const l=leftEdge.step(edgeTargets(speedL,materialSettings)[0]*intensity,k/(1+materialSettings.lag*.013),damper,dt),rr=rightEdge.step(edgeTargets(speedR,materialSettings)[1]*intensity,k,damper,dt);material.style.background=blendBackground(p);material.style.transform=`translate3d(${(l+rr)/2}px,0,0) scaleX(${Math.max(.7,(w+rr-l)/w)})`;const roundingL=cornerLeft.step(r,k,damper,dt),roundingR=cornerRight.step(r,k,damper,dt);material.style.borderRadius=`${roundingL}px ${roundingR}px ${roundingR}px ${roundingL}px`;material.style.overflow='hidden';const reflection=reflectionSpring.step(Math.max(-35,Math.min(35,(speedL+speedR)*5)),k*.65,damper,dt);fields.style.transform=`translate3d(${reflection.toFixed(2)}px,0,0)`;
 if(ambient){for(const [name,start,end,origin] of [['left',ambientSource.left,ambientTarget.left,x],['top',ambientSource.top,ambientTarget.top,y],['width',ambientSource.width,ambientTarget.width,0],['height',ambientSource.height,ambientTarget.height,0]])ambient.style.setProperty('--ambient-'+name,lerp(start,end,p)-origin+'px');ambient.style.opacity=String(lerp(ambientStart,ambientEnd,p));}
 movingAmbient?.frame(now,timeline.direction,{left:x,top:y});
 for(const item of shared){if(item.closingSummary)setSummaryProgress(item.node,item.summaryStart*(1-Math.min(1,t/.28)));let textP=p,opacity=1,xPos=lerp(item.a.left,item.b.left,p),yPos=lerp(item.a.top,item.b.top,p);if(item.sourceHidden&&item.targetHidden){opacity=0;}else if(item.sourceHidden){const origin={left:x+item.a.left-a.left,top:y+item.a.top-a.top},fadeProgress=Math.max(0,Math.min(1,t/.18)),moveProgress=Math.max(0,Math.min(1,(t-.08)/.60));item.revealOrigin=origin;textP=1-Math.pow(1-moveProgress,3);opacity=1-Math.pow(1-fadeProgress,2);xPos=lerp(origin.left,item.b.left,textP);yPos=lerp(origin.top,item.b.top,textP);}else if(item.targetHidden){const moveProgress=Math.max(0,Math.min(1,t/.76)),fadeProgress=Math.max(0,Math.min(1,t/.42));textP=1-Math.pow(1-moveProgress,3);opacity=1-fadeProgress*fadeProgress*(3-2*fadeProgress);}const fontSize=lerp(item.fontA,item.fontB,textP),lineHeight=lerp(item.lineA,item.lineB,textP),letterSpacing=lerp(item.spacingA,item.spacingB,textP),color=item.blendColor(textP),fontWeight=lerp(item.weightA,item.weightB,textP),visibleOpacity=opacity*lerp(item.opacityA,item.opacityB,textP)*Number(item.node.dataset?.revealOpacity??1);Object.assign(item.node.style,{left:xPos-x+'px',top:yPos-y+'px',width:lerp(item.a.width,item.b.width,textP)+'px',fontSize:fontSize+'px',fontWeight,lineHeight:String(lineHeight),letterSpacing:letterSpacing+'px',color,opacity:String(visibleOpacity)});item.words?.paint(item,{x,y,xPos,yPos,textP,opacity:visibleOpacity,fontSize,lineHeight,letterSpacing,color,fontWeight});}
 outgoing.style.opacity=String(Math.max(0,1-t/(galleryReturn?.11:.22)));incoming.style.opacity=String(Math.max(0,Math.min(1,(t-.38)/.36)));incoming.style.transform=`translate(${(b.left-x)*.12}px,${(b.top-y)*.12}px)`;
 if(picture){if(Number.isFinite(from.image.rounding))picture.style.setProperty('--image-rounding',lerp(from.image.rounding,targetImageRounding,p)+'px');for(const side of ['top','right','bottom','left'])picture.style.setProperty('--image-padding-'+side,lerp(from.image.padding?.[side]||0,targetPadding[side]||0,p)+'px');picture.style.setProperty('--image-size-limit',String(lerp(from.image.sizeLimit??1,targetSizeLimit,p)));picture.style.background=blendImageBacking(p);picture.style.setProperty('--image-overlay',String(lerp(from.image.shade||0,targetShade,p)));picture.style.setProperty('--image-shade-height',lerp(from.image.shadeHeight||0,targetShadeHeight,p)+'px');const ia=from.image.rect;Object.assign(picture.style,{left:lerp(ia.left,iv.left,p)-x+'px',top:lerp(ia.top,iv.top,p)-y+'px',width:lerp(ia.width,iv.width,p)+'px',height:lerp(ia.height,iv.height,p)+'px',borderRadius:lerp(from.image.radius,targetFrameRadius,p)+'px'});const imageX=lerp(ia.left+ia.width/2,iv.left+iv.width/2,p),imageY=lerp(ia.top+ia.height/2,iv.top+iv.height/2,p);const velocityX=previousImage?(imageX-previousImage.x)/(dt*16.667):0,velocityY=previousImage?(imageY-previousImage.y)/(dt*16.667):0;previousImage={x:imageX,y:imageY};const exposure=imageEffects.blur?motionTrail(velocityX,velocityY,materialSettings.motionBlur):{x:0,y:0};imageMotion.x=easeMaterial(imageMotion.x,exposure.x,dt);imageMotion.y=easeMaterial(imageMotion.y,exposure.y,dt);if(nextPicture)nextPicture.style.cssText=picture.style.cssText;for(const image of imageRenderers){image.imageFrame.resize();image.setMotion(imageMotion.x,imageMotion.y);}if(nextPicture){const blend=nextImageGate.isReady()?Math.max(0,Math.min(1,(t-.3)/.35)):0;nextPicture.style.opacity=String(blend);picture.style.opacity=String(1-blend);}}
 if(!timeline.finished){requestAnimationFrame(frame);return;}
 const ripple=(timeline.direction>0?imageRenderers.at(-1):imageRenderers[0])?.rippleState(now);
 detachSummary();for(const detach of detachHeadingReveal)detach();for(const item of shared)item.detachStream();
 const receiver=timeline.direction>0?to:from.element?.isConnected?from.element:null;
 const receiverVisual=receiver?.querySelector('.visual'),receiverImage=getLiquidImage(receiverVisual);
 const paintedPicture=timeline.direction>0&&nextPicture&&nextImageGate.isReady()?nextPicture:picture;
 if(receiverVisual&&paintedPicture)handoffImage(paintedPicture.querySelector('img'),receiverVisual,{beforeReveal:()=>{receiverImage?.imageFrame.resize();receiverImage?.resumeRipple(ripple);if(receiverImage?.ready)receiverImage.draw(performance.now());}});
 nextImageGate?.dispose();for(const image of imageRenderers)image.destroy();
 // On Escape the live source receives the material again; the unopened
 // destination stays hidden until the navigation transaction discards it.
 if(receiver){
  const skin=receiver.querySelector(':scope > .liquid-skin');
  const targetImage=getLiquidImage(receiver.querySelector('.visual'));
  const continued=targetImage?.resumeRipple(ripple);
  if(skin){
   skin.style.transform=material.style.transform;skin.style.borderRadius=material.style.borderRadius;
   const restingReflection=skin.firstElementChild;restingReflection.style.transform=fields.style.transform;
   targetImage?.setMotion(imageMotion.x,imageMotion.y);
   let last=now;
   const settle=time=>{
    if(!skin.isConnected)return;
    // Escape can restore another layout after the morph hands its material
    // back. Follow that layout's native size and corners while settling.
    const restingRadius=parseFloat(getComputedStyle(receiver).borderTopLeftRadius)||0;
    const restingWidth=receiver.offsetWidth||receiver.getBoundingClientRect().width;
    const dt=Math.min(1.5,(time-last)/16.667);last=time;
    const {k,damper}=springParameters(materialSettings);
    const l=leftEdge.step(0,k/(1+materialSettings.lag*.013),damper,dt),rr=rightEdge.step(0,k,damper,dt);
    skin.style.transform=`translate3d(${(l+rr)/2}px,0,0) scaleX(${Math.max(.7,(restingWidth+rr-l)/restingWidth)})`;

    const reflection=reflectionSpring.step(0,k*.65,damper,dt);restingReflection.style.transform=`translate3d(${reflection.toFixed(2)}px,0,0)`;
    imageMotion.x=easeMaterial(imageMotion.x,0,dt);imageMotion.y=easeMaterial(imageMotion.y,0,dt);targetImage?.setMotion(imageMotion.x,imageMotion.y);
    const roundingL=cornerLeft.step(restingRadius,k,damper,dt),roundingR=cornerRight.step(restingRadius,k,damper,dt);
    skin.style.borderRadius=`${roundingL}px ${roundingR}px ${roundingR}px ${roundingL}px`;
    if(Math.abs(imageMotion.x)+Math.abs(imageMotion.y)+Math.abs(reflectionSpring.position)+Math.abs(reflectionSpring.velocity)+Math.abs(roundingL-restingRadius)+Math.abs(roundingR-restingRadius)+Math.abs(cornerLeft.velocity)+Math.abs(cornerRight.velocity)+Math.abs(l)+Math.abs(rr)+Math.abs(leftEdge.velocity)+Math.abs(rightEdge.velocity)>.1)requestAnimationFrame(settle);
    else{skin.style.transform='';skin.style.borderRadius='';restingReflection.style.transform='';targetImage?.setMotion(0,0);}
   };
   requestAnimationFrame(settle);
  }
  if(targetImage?.ready)targetImage.draw(now);receiver.style.visibility='';if(!continued)pulseImages(receiver,1.3,{onlyIfIdle:true});
 }else to.style.visibility='';
 movingAmbient?.handoff(receiver);
 removeShellViewport();
 if(!keepAmbient&&!movingAmbient&&timeline.direction>0)glow.animate([{opacity:glow.style.opacity},{opacity:0}],{duration:500,fill:'forwards'}).finished.then(removeGlowViewport,removeGlowViewport);
 else removeGlowViewport();
 resolve();
 }requestAnimationFrame(frame)});
 }finally{nextImageGate?.dispose();restoreTarget();restoreSource();restoreSourceCopy();restoreTargetCopy();}
}
export function edgeHover(el,strength,reduced){let raf=0;const enter=()=>{if(reduced())return;cancelAnimationFrame(raf);const start=performance.now(),r=parseFloat(getComputedStyle(el).borderRadius)||64;function tick(now){if(!el.isConnected)return;const t=Math.min(1,(now-start)/1100),rect=el.getBoundingClientRect();el.style.clipPath=`path('${contour(rect.width,rect.height,r,Math.sin(t*Math.PI)*strength()*.38,t*3)}')`;if(t<1)raf=requestAnimationFrame(tick);else el.style.clipPath='';}raf=requestAnimationFrame(tick)};el.addEventListener('pointerenter',enter);return {destroy(){cancelAnimationFrame(raf);el.removeEventListener('pointerenter',enter);el.style.clipPath=''}};}
