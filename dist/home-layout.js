import {EASE} from './motion-tokens.js';
import {mountTextListHover} from './text-list-hover.js';
import {homeAboutMarkup,homeListSectionsMarkup} from './home-about.js';
import {homeApproachMarkup} from './home-approach.js';
import {homeServicesMarkup} from './home-services.js';
import {homeTestimonialsMarkup} from './home-testimonials.js';
import {homeWritingMarkup} from './home-writing.js';
import {fitHeroToViewport} from './hero-viewport.js';
import {HeroTimeline} from './hero-timeline.js';
import {HeroCarousel} from './hero-carousel.js';
import {homeHero,heroCopyMarkup,normalizeHeroContent} from './home-content.js';
import {card} from './card-renderer.js';
import {contentBlocks} from './content-blocks.js';
import {content} from './content/local.js';
import {escapeText} from './content/html.js';
import {flipPose,masonryMinimumHeight,masonryPlan,clamp} from './placement.js';
import {createStageReveal} from './feature-stage-reveal.js';
import {homeOverviewMarkup} from './home-overview.js';

export function homeProductText(documents){
 const independent=['rios','bastion','merlin','porter'],unique=documents.filter(doc=>!doc.body&&!doc.sourceProjectId),groups=[['Projects',unique.filter(doc=>!independent.includes(doc.id))],['Independent and R&D',independent.map(id=>unique.find(doc=>doc.id===id)).filter(Boolean)]];
 return '<section class="home-product-text" data-home-product-text aria-label="Projects" hidden>'+groups.map(([title,items])=>'<div class="home-product-text-group"><h2>'+escapeText(title)+'</h2><ul>'+items.map(doc=>'<li><a href="#'+escapeText(doc.id)+'" data-text-project="'+escapeText(doc.id)+'" data-project-menu-item="'+escapeText(doc.id)+'"><span>'+escapeText(independent.includes(doc.id)?doc.name:doc.client?doc.client.split(' • ')[0]+' · '+doc.name:doc.name)+'</span><p>'+escapeText(doc.title)+'</p></a></li>').join('')+'</ul></div>').join('')+'</section>';
}
export function homeMarkup(documents,layout,{heroContent='timeline'}={}){
 const projects=documents.filter(doc=>!doc.body&&!doc.listOnly);
 const slot=(doc,index)=>`<div class="card-slot" data-slot="${doc.id}"><div class="card-placement">${card(doc,index,layout)}</div></div>`;
 const gallery=content.get('home')?.blocks.find(block=>block.id==='home-projects');
 return `<div class="homepage-layout">${homeHero({heroContent})}${homeOverviewMarkup()}${homeProductText(documents)}<div class="home-product-carousel" data-home-product-gallery hidden>${gallery?contentBlocks([gallery],2):''}</div><section class="hero-carousel-stage" data-hero-carousel aria-label="Selected projects carousel" hidden><div class="hero-carousel-controls" data-carousel-controls><button type="button" data-carousel-previous aria-label="Previous projects">←</button><span>Drag to browse · Scroll to explore</span><button type="button" data-carousel-pause aria-label="Pause carousel" aria-pressed="false">Ⅱ</button><button type="button" data-carousel-next aria-label="Next projects">→</button></div></section><div class="home-work">
 <div class="gallery-toolbar"><h2 class="sr">Selected work & explorations</h2></div>
 <div class="gallery-grid" data-gallery>${projects.map((doc,index)=>slot(doc,index)).join('')}</div>
 <div class="grid info-grid" data-information hidden></div>
 </div>
 ${homeAboutMarkup()}${homeApproachMarkup()}${homeListSectionsMarkup()}${homeServicesMarkup()}${homeWritingMarkup()}${homeTestimonialsMarkup()}<nav class="flip-index" aria-label="Project spotlight">${projects.map((doc,index)=>`<button data-spotlight="${escapeText(doc.id)}" aria-label="Show ${escapeText(doc.name)}" title="${escapeText(doc.name)}"><span aria-hidden="true"></span></button>`).join('')}</nav></div>`;
}

// The three adapters own placement and shared spotlight selection. Documents, DOM cards, image contexts and
// navigation remain shared when the arrangement changes.
// Alternating rows one full-width card, shown like the one-column composition, then two side by side.
export const HOME_LAYOUTS=Object.freeze(['masonry','regular','alternating']);
export const readHomeLayout=value=>HOME_LAYOUTS.includes(value)?value:'masonry';
export function alternatingSpan(index,count){return index%3===0||index===count-1&&index%3===1?'full':'half';}
export class HomeLayout {
 constructor(root,documents,{mode='current',layout='masonry',columns=2,oneColumnPosition='top',multiColumnPosition='top',showCopyOnHover=false,productDisplay='cards',heroContent='timeline',timelineMode='cursor',heroCarousel=false,carouselState={},heroCarouselSettings=()=>({}),featuredLarger=true,reduced=()=>false,onMotion=()=>{}}={}){
  this.root=root;this.heroContent=normalizeHeroContent(heroContent);this.timelineMode=timelineMode;this.documents=documents;this.reduced=reduced;this.onMotion=onMotion;
  this.gallery=root.querySelector('[data-gallery]');this.information=root.querySelector('[data-information]');
  this.slots=new Map([...root.querySelectorAll('[data-slot]')].map(slot=>[slot.dataset.slot,slot]));
  this.heroCarousel=!!heroCarousel;this.carousel=new HeroCarousel(root,this.slots,{reduced,state:carouselState,settings:heroCarouselSettings});
  this.heroGreeting=root.querySelector('[data-hero-greeting]');this.heroAbout=root.querySelector('.hero-about');this.heroTitle=root.querySelector('[data-hero-title]');this.heroCopy=root.querySelector('[data-hero-copy]');
  this.introduction={title:this.heroTitle.textContent,titleHTML:this.heroTitle.innerHTML,copy:this.heroCopy.innerHTML};
  this.poses=new Map();this.activeId=documents[0]?.id;this.paused=false;this.dead=false;
  this.endMotion=()=>{if(this.raf&&!this.paused){this.motionTimer=setTimeout(this.endMotion,60);return;}this.onMotion(false);};
  this.scroll=()=>{if(this.mode==='current'||this.paused)return;if(this.mode==='flip'){this.onMotion(true);clearTimeout(this.motionTimer);this.motionTimer=setTimeout(this.endMotion,180);}this.schedule();};
  this.resize=()=>this.schedule();addEventListener('scroll',this.scroll,{passive:true});addEventListener('resize',this.resize);
  this.observer=new ResizeObserver(()=>this.schedule());this.observer.observe(this.gallery);
  for(const slot of this.slots.values())this.observer.observe(slot.querySelector('[data-card]'));
  for(const button of root.querySelectorAll('[data-spotlight]'))button.onclick=()=>this.focus(button.dataset.spotlight,'smooth');
  this.textListHover=mountTextListHover(root,documents,{reduced});
  this.featureStage=false;this.featuredLarger=featuredLarger!==false;
  this.setProductDisplay(productDisplay);this.apply({mode,layout,columns,oneColumnPosition,multiColumnPosition,showCopyOnHover});this.resume();
 }
 setProductDisplay(value){this.textListHover?.hide();this.productDisplay=['carousel','text'].includes(value)?value:'cards';const page=this.root.querySelector('.homepage-layout');if(page)page.dataset.productDisplay=this.productDisplay;const carousel=this.root.querySelector('[data-home-product-gallery]');if(carousel)carousel.hidden=this.productDisplay!=='carousel';const text=this.root.querySelector('[data-home-product-text]');if(text)text.hidden=this.productDisplay!=='text';const work=this.root.querySelector('.home-work');if(work)work.hidden=this.productDisplay!=='cards';}
 apply({mode=this.mode,layout=this.layout,columns=this.columns,oneColumnPosition=this.oneColumnPosition,multiColumnPosition=this.multiColumnPosition,showCopyOnHover=this.showCopyOnHover}={}){
  this.carousel.setEnabled(false);
  this.pause();this.mode=this.productDisplay!=='cards'?'current':['flip','flat'].includes(mode)?mode:'current';this.layout=readHomeLayout(layout);this.columns=clamp(Number(columns)||2,1,4);
  this.oneColumnPosition=['top','bottom','left','right','alternating'].includes(oneColumnPosition)?oneColumnPosition:'top';
  this.multiColumnPosition=['top','bottom'].includes(multiColumnPosition)?multiColumnPosition:'top';this.showCopyOnHover=!!showCopyOnHover;
  this.root.classList.toggle('home-view-split',this.mode!=='current');this.root.classList.toggle('home-view-flip',this.mode==='flip');this.root.classList.toggle('home-view-flat',this.mode==='flat');this.gallery.style.setProperty('--gallery-columns',this.columns);
  this.gallery.dataset.layout=this.layout==='masonry'?'masonry':'regular';this.gallery.dataset.arrangement=this.layout;this.syncCardComposition();
  for(const doc of this.documents){const slot=this.slots.get(doc.id),carrier=slot.firstElementChild,element=slot.querySelector('[data-card]');
   element.dataset.cardLayout=this.gallery.dataset.layout;element.dataset.cardOrientation=doc.cardAspect||'landscape';element.dataset.cardPresentation=this.mode==='flip'?'flip':'current';
   slot.style.gridRow='';slot.style.gridColumn='';slot.style.removeProperty('--masonry-card-height');carrier.style.transform='';carrier.style.opacity='';carrier.style.zIndex='';
   (this.mode!=='current'||!doc.body?this.gallery:this.information).append(slot);
  }
  this.gallery.dataset.masonryRhythm=String(this.mode==='current'&&this.layout==='masonry');
  this.information.hidden=this.mode!=='current'||!this.documents.some(doc=>doc.body);this.poses.clear();
  for(const button of this.root.querySelectorAll('[data-layout]')){const selected=button.dataset.layout===this.layout;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));}
  this.flush(true);
 }
 syncCardComposition(){
  if(!this.gallery)return;
  // The featured stage owns the whole row, so it forces one column over both the column count and alternating rows.
  const alternating=this.mode==='current'&&this.layout==='alternating'&&!this.featureStage,multi=alternating||this.mode==='current'&&this.columns>1&&!this.featureStage;this.gallery.dataset.copyLayout=multi?'multiple':'single';
  const projects=this.documents.filter(doc=>!doc.body&&this.slots.get(doc.id)?.querySelector('[data-card]'));let wideIndex=0;
  projects.forEach((doc,index)=>{const slot=this.slots.get(doc.id),element=slot.querySelector('[data-card]'),span=alternating?alternatingSpan(index,projects.length):null,wide=!multi||span==='full';
   // The wide row is a larger, left-aligned image with its description underneath.
   const oneColumn=alternating?'bottom':this.oneColumnPosition==='alternating'?(wideIndex%2?'right':'left'):this.oneColumnPosition;if(wide)wideIndex++;
   if(span){slot.dataset.cardSpan=span;element.dataset.cardSpan=span;}else{delete slot.dataset.cardSpan;delete element.dataset.cardSpan;}
   const staged=this.featureStage&&doc.featured===true;if(staged)element.dataset.featureStage='true';else delete element.dataset.featureStage;
   element.dataset.cardCopyPosition=staged?'left':wide?oneColumn:this.multiColumnPosition;element.dataset.copyHover=String(!wide&&this.showCopyOnHover);
  });
 }
 setCopyHover(enabled){this.showCopyOnHover=!!enabled;this.syncCardComposition();}
 flush(immediate=false,dt=1){
  if(this.dead)return;
  if(this.mode==='current'){
   const count=this.featureStage?1:Math.min(this.layout==='alternating'?2:this.columns,innerWidth<=600?1:innerWidth<=1000?2:4);this.gallery.style.setProperty('--effective-columns',count);this.gallery.dataset.columns=count;
   if(this.layout==='masonry'){
    this.placeMasonry(count);
   }else for(const slot of this.gallery.children){slot.style.gridRow='';slot.style.gridColumn='';}
   this.updateDescription();fitHeroToViewport(this.root,{carousel:this.heroCarousel});this.carousel.setEnabled(this.heroCarousel&&this.productDisplay==='cards');return;
  }
  this.gallery.dataset.columns=1;
  const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||112;
  const focus=header+(innerHeight-header)*.5;
  const reads=[...this.slots].map(([id,slot])=>{const rect=slot.getBoundingClientRect();return {id,slot,offset:(rect.top+rect.height/2-focus)/Math.max(1,rect.height)};});
  const best=reads.reduce((a,b)=>Math.abs(a.offset)<Math.abs(b.offset)?a:b),previous=reads.find(item=>item.id===this.activeId);
  const oldActive=this.activeId;if(!previous||Math.abs(previous.offset)-Math.abs(best.offset)>.12)this.activeId=best.id;
  for(const {id,slot} of reads)slot.querySelector('[data-card]').dataset.videoSpotlight=String(id===this.activeId);
  let moving=false;
  if(this.mode==='flip')for(const {id,slot,offset} of reads){
   const target=flipPose(offset,this.reduced()),pose=this.poses.get(id)||{...target};
   for(const key of ['angle','scale','opacity']){const delta=target[key]-pose[key];pose[key]+=immediate||this.reduced()?delta:delta*(1-Math.pow(.78,dt));if(Math.abs(delta)>.002&&!this.reduced())moving=true;}
   this.poses.set(id,pose);const carrier=slot.firstElementChild;
   carrier.style.transform=`perspective(1500px) rotateX(${pose.angle.toFixed(3)}deg) scale(${pose.scale.toFixed(4)})`;
   carrier.style.opacity=String(pose.opacity);carrier.style.zIndex=id===this.activeId?'2':'1';
  }
  this.updateDescription();if(oldActive!==this.activeId)globalThis.dispatchEvent?.(new Event('gallery-selection-change'));if(moving&&!immediate&&!this.paused)this.schedule();
 }
 placeMasonry(count){
  const gap=parseFloat(getComputedStyle(this.gallery).columnGap)||0;
  const width=Math.max(1,(this.gallery.clientWidth-gap*(count-1))/count);
  // With "Featured cards larger" off, featured cards are placed like any other: one column wide, portraits twice as tall.
  const items=[...this.gallery.children].map(slot=>this.documents.find(doc=>doc.id===slot.dataset.slot)).map(doc=>this.featuredLarger||doc.featured!==true?doc:{...doc,featured:false});
  // Shared height modules suit multi-column boards; in a single column each
  // card should keep its own measured height instead of doubling portraits.
  const matchHeights=count>2;this.gallery.dataset.masonryRhythm=String(matchHeights);
  // Set widths together before measuring title wrapping. Never remount cards
  // or measure the fixed card height, which would feed back into the next pass.
  for(const item of items){const slot=this.slots.get(item.id),span=item.featured===true&&count>=3?2:1,current=slot.style.gridColumn?.match(/^(\d+) \/ span (\d+)$/),column=clamp(Number(current?.[1])||1,1,count-span+1);if(!current||Number(current[2])!==span||Number(current[1])!==column)slot.style.gridColumn=`${column} / span ${span}`;if(!matchHeights)slot.style.removeProperty('--masonry-card-height');}
  if(!matchHeights){
   const heights=Object.fromEntries(items.map(item=>[item.id,this.slots.get(item.id).querySelector('[data-card]').offsetHeight]));
   const maximum=Math.max(1,...Object.values(heights));
   for(const pose of masonryPlan(items,count,maximum,gap,8,heights)){const slot=this.slots.get(pose.id),row=`${pose.row} / span ${pose.rowSpan}`,column=`${pose.column} / span ${pose.columnSpan}`;if(slot.style.gridRow!==row)slot.style.gridRow=row;if(slot.style.gridColumn!==column)slot.style.gridColumn=column;}
   return;
  }
  const px=value=>parseFloat(value)||0;
  const aspect=getComputedStyle(document.documentElement).getPropertyValue('--image-frame-regular-aspect').split('/').map(px),ratio=aspect[0]&&aspect[1]?aspect[0]/aspect[1]:1.6;
  const minimum=Math.max(...items.map(item=>{
   const element=this.slots.get(item.id).querySelector('[data-card]'),style=getComputedStyle(element),copy=element.querySelector('.card-copy'),visual=element.querySelector('.visual');
   const copyVisible=copy&&getComputedStyle(copy).position!=='absolute',copyHeight=copyVisible?copy.offsetHeight:0;
   const padding=Object.fromEntries(['top','right','bottom','left'].map(side=>[side,px(style['padding'+side[0].toUpperCase()+side.slice(1)])]));
   const imageStyle=getComputedStyle(visual),imagePadding=Object.fromEntries(['top','right','bottom','left'].map(side=>[side,px(imageStyle.getPropertyValue('--image-padding-'+side))]));
   const visualSideExpansion=innerWidth>850&&element.dataset.cardOrientation==='landscape'&&element.dataset.imageMode!=='bleed'?Math.max(0,(visual.offsetWidth-Math.max(1,element.clientWidth-padding.left-padding.right))/2):0;
   return masonryMinimumHeight({width,ratio,padding,copyHeight,margin:px(imageStyle.marginTop)+px(imageStyle.marginBottom),bleed:element.dataset.imageMode==='bleed',imagePadding,visualSideExpansion});
  }));
  // The row unit comes from the stylesheet (8px; the images-only Lab uses 1px so cards end exactly at their image).
  const row=parseFloat(getComputedStyle(this.gallery).gridAutoRows)||8;
  for(const pose of masonryPlan(items,count,minimum,gap,row)){
   const slot=this.slots.get(pose.id),row=`${pose.row} / span ${pose.rowSpan}`,column=`${pose.column} / span ${pose.columnSpan}`,height=pose.height+'px';
   if(slot.style.gridRow!==row)slot.style.gridRow=row;
   if(slot.style.gridColumn!==column)slot.style.gridColumn=column;
   if(slot.style.getPropertyValue('--masonry-card-height')!==height)slot.style.setProperty('--masonry-card-height',height);
  }
 }
 updateDescription(){
  const doc=this.mode!=='current'&&scrollY>8?this.documents.find(doc=>doc.id===this.activeId):null;
  if(this.heroAbout)this.heroAbout.dataset.heroCombinedContent=String(!doc&&(this.heroContent.timeline||this.heroContent.timelineText)&&this.heroContent.description);
  const key=doc?.id||'introduction';if(this.lastDescription===key)return;this.lastDescription=key;
  this.timeline?.destroy();this.timeline=null;if(this.heroGreeting)this.heroGreeting.hidden=!!doc;
  this.heroTitle.textContent=doc?doc.title:this.introduction.title;
  if(!doc&&this.introduction.titleHTML)this.heroTitle.innerHTML=this.introduction.titleHTML;
  if(doc){const paragraph=document.createElement('p');paragraph.textContent=doc.intro||doc.context||doc.body?.[0]||'';this.heroCopy.replaceChildren(paragraph);}
  else{this.heroCopy.innerHTML=this.introduction.copy;const timeline=this.heroCopy.querySelector?.('[data-hero-timeline]');if(timeline)this.timeline=new HeroTimeline(timeline,{mode:this.timelineMode,reduced:this.reduced});}
  for(const button of this.root.querySelectorAll('[data-spotlight]')){const active=doc?.id===button.dataset.spotlight;button.classList.toggle('active',active);active?button.setAttribute('aria-current','true'):button.removeAttribute('aria-current');}
 }
 schedule(){if(this.dead||this.paused||this.raf)return;this.raf=requestAnimationFrame(now=>{this.raf=0;const dt=this.lastFrame?clamp((now-this.lastFrame)/16.667,.3,1.5):1;this.lastFrame=now;this.flush(false,dt);});}
 focus(id,behavior='instant'){
  const slot=this.slots.get(id);if(!slot)return;
  const r=slot.getBoundingClientRect(),header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||112;
  const center=header+(innerHeight-header)*.5;
  window.scrollTo({top:Math.max(0,scrollY+r.top+r.height/2-center),behavior:this.reduced()?'instant':behavior});this.activeId=id;this.flush(true);
 }
 async prepareOpen(id,control,duration){
  if(this.mode!=='flip')return;
  this.pause();const carrier=this.slots.get(id)?.firstElementChild;if(!carrier)return;
  const animation=carrier.animate([{transform:getComputedStyle(carrier).transform,opacity:getComputedStyle(carrier).opacity},{transform:'perspective(1500px) rotateX(0deg) scale(1)',opacity:1}],{duration:this.reduced()?0:Math.min(220,duration*.2),easing:EASE.settle,fill:'both'});
  control.track(animation);await animation.finished;
  if(!control.reversed){carrier.style.transform='perspective(1500px) rotateX(0deg) scale(1)';carrier.style.opacity='1';this.poses.set(id,{angle:0,scale:1,opacity:1});}
 }
 holdCard(id){if(this.mode!=='flip')return;this.pause();const carrier=this.slots.get(id)?.firstElementChild;if(carrier){carrier.style.transform='perspective(1500px) rotateX(0deg) scale(1)';carrier.style.opacity='1';this.poses.set(id,{angle:0,scale:1,opacity:1});}}
 setHeroContent(mode){this.heroContent=normalizeHeroContent(mode);this.introduction.copy=heroCopyMarkup(this.heroContent);this.lastDescription=null;this.updateDescription();this.schedule();}
 setTimelineMode(mode){this.timelineMode=mode==='drag'?'drag':'cursor';this.timeline?.setMode(this.timelineMode);}
 setFeatureStage(enabled){enabled=!!enabled;if(enabled===this.featureStage)return;this.featureStage=enabled;this.syncCardComposition();this.flush(true);
  this.stageReveal?.destroy();this.stageReveal=enabled?createStageReveal(this.gallery):null;}
 setFeaturedLarger(enabled){enabled=!!enabled;if(enabled===this.featuredLarger)return;this.featuredLarger=enabled;this.flush(true);}
 setHeroCarousel(enabled){this.heroCarousel=!!enabled;this.carousel.setEnabled(this.mode==='current'&&this.heroCarousel&&this.productDisplay==='cards');this.flush(true);}
 pause(){this.textListHover?.hide();this.timeline?.stop();this.carousel?.pause();this.paused=true;cancelAnimationFrame(this.raf);this.raf=0;}
 resume(){if(this.dead)return;this.paused=false;this.carousel.resume();this.schedule();}
 destroy(){this.stageReveal?.destroy();this.textListHover?.destroy();this.timeline?.destroy();this.carousel.destroy();this.dead=true;this.pause();clearTimeout(this.motionTimer);this.observer.disconnect();removeEventListener('scroll',this.scroll);removeEventListener('resize',this.resize);}
}
