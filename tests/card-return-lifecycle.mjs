import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {retainHome} from '../dist/retained-home.js';
import {TransitionControl,morphProgress} from '../dist/transition-control.js';
import {AssistantNavigationMemory} from '../dist/assistant-navigation-memory.js';
import {ProjectEntryMemory} from '../dist/project-entry-memory.js';
import {cardNavigation} from '../dist/card-navigation.js';
import {neighborPush} from '../dist/placement.js';
import {clearImageHandoffs} from '../dist/image-handoff.js';

// Execute the production router/render/cleanup across a completed opening and
// a later close. A new home image starts undecoded, exposing the old rebuild
// race that midpoint-only morph tests could not exercise.
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const extract=(from,to)=>app.slice(app.indexOf(from),app.indexOf(to));
const code={galleryOriginTarget:extract('function galleryOriginTarget(','function syncGalleryOrigin('),syncGalleryOrigin:extract('function syncGalleryOrigin(','function disposeGalleryOrigin('),syncDockActions:extract('function syncDockActions(','installHoverTrail('),cleanup:extract('function cleanup()','function render('),render:extract('function render(','function syncRouteChrome('),scrollPage:extract('function scrollPage(','function navigateAssistant('),runNavigation:extract('async function runNavigation()','function homeScrollMotion('),navigate:extract('async function navigate(){','async function runNavigation()'),pushCards:extract('function pushCards(','async function slideCards('),slideCardsImplementation:extract('async function slideCards(','function fadeUpIn(')};
const compile=text=>new Function('env','args',`with(env){return (${text}).apply(null,args);}`);
class Style{
 get cssText(){return Object.entries(this).map(([key,value])=>`${key}:${value}`).join(';');}
 set cssText(value){for(const key of Object.keys(this))delete this[key];for(const pair of value.split(';').filter(Boolean)){const at=pair.indexOf(':');this[pair.slice(0,at)]=pair.slice(at+1);}}
 getPropertyValue(key){return this[key]||'';}
 getPropertyPriority(){return '';}
 setProperty(key,value){this[key]=value;}
 removeProperty(key){delete this[key];}
}
class Node{
 constructor(classes='',data={}){this.classes=new Set(classes.split(' ').filter(Boolean));this.dataset={...data};this.style=new Style();this.children=[];this.id='';this.hidden=false;this.rect={left:100,top:150,width:600,height:400};this.classList={add:name=>this.classes.add(name),remove:name=>this.classes.delete(name),contains:name=>this.classes.has(name),toggle:(name,on)=>{on??=!this.classes.has(name);on?this.classes.add(name):this.classes.delete(name);}};}
 get className(){return [...this.classes].join(' ');}set className(value){this.classes=new Set(value.split(' ').filter(Boolean));}
 get childNodes(){return this.children;}get isConnected(){return this.root===true||!!this.parentNode?.isConnected;}
 append(...nodes){for(const node of nodes){node.remove();this.children.push(node);node.parentNode=this;node.parentElement=this;}}
 replaceChildren(...nodes){for(const child of [...this.children])child.remove();this.append(...nodes);}
 remove(){if(this.parentNode){this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null;this.parentElement=null;}}
 setAttribute(key,value){this[key]=value;}removeAttribute(key){delete this[key];}
 cloneNode(deep=false){const node=new Node(this.className,this.dataset);node.rect=this.rect;node.id=this.id;node.style.cssText=this.style.cssText;if(deep)node.append(...this.children.map(child=>child.cloneNode(true)));return node;}
 getBoundingClientRect(){return this.rect;}
 all(){return this.children.flatMap(child=>[child,...child.all()]);}
 contains(node){return node===this||this.all().includes(node);}
 closest(selector){for(let node=this;node;node=node.parentNode)if(node.matches(selector))return node;return null;}
 matches(selector){if(selector==='[data-gallery-item]')return this.dataset.galleryItem!==undefined;if(selector==='[data-card-gallery]')return this.dataset.cardGallery!==undefined;if(selector.startsWith('.'))return selector.slice(1).split('.').every(name=>this.classes.has(name));const data=selector.match(/^\[data-(card|content-card)(?:="([^"]+)")?\]$/);if(data){const key=data[1]==='card'?'card':'contentCard';return this.dataset[key]!==undefined&&(!data[2]||this.dataset[key]===data[2]);}return false;}
 querySelectorAll(selector){return this.all().filter(node=>selector.split(',').some(part=>node.matches(part.trim())));}
 querySelector(selector){if(selector==='.detail>.project-summary')return this.querySelector('.detail')?.querySelector('.project-summary')||null;return this.querySelectorAll(selector)[0]||null;}
 animate(frames,options){let resolve;const animation={effect:{getComputedTiming:()=>({endTime:options.duration})},finished:new Promise(done=>resolve=done),currentTime:0,playbackRate:1,pause(){this.paused=true;},finish(){resolve();},cancel(){this.cancelled=true;},reverse(){this.playbackRate=-1;}};return animation;}
}
function fixture({homeGallery=false}={}){
 const body=new Node();body.root=true;const main=new Node(),ask=new Node(),messages=new Node();main.id='main';main.rect={left:100,top:0,width:1200,height:2000};ask.append(messages);body.append(main,ask);
 const root=new Node(),controls=new Map(),getControl=id=>{if(!controls.has(id))controls.set(id,{value:'',checked:false,hidden:false});return controls.get(id);};
 const doc={body,documentElement:root,createElement:()=>new Node(),querySelector(selector){if(selector.startsWith('#askMessages '))return messages.querySelector(selector.slice(13));return body.querySelector(selector);},querySelectorAll:selector=>body.querySelectorAll(selector)};
 globalThis.document=doc;globalThis.getComputedStyle=node=>({position:'relative',padding:'0px',opacity:node.style.opacity||'1'});
 const image=(loaded)=>{const node=new Node();node.tag='img';node.naturalWidth=loaded?1000:0;return node;};
 const card=(id,chat=false)=>{const node=new Node('surface project-card image-card',chat?{contentCard:id}:{card:id}),visual=new Node('visual');visual.img=image(chat);visual.append(visual.img);node.visual=visual;node.append(visual,new Node('project-summary'));return node;};
 const detail=id=>{const node=new Node('surface detail'),visual=new Node('visual');node.project=id;visual.img=image(true);visual.append(visual.img);node.visual=visual;node.append(visual,new Node('project-summary'));return node;};
 let homesBuilt=0,detailsBuilt=0;
 Object.defineProperty(main,'innerHTML',{set(value){if(!value){this.replaceChildren();return;}if(value==='about'){detailsBuilt++;const about=new Node('surface detail info-detail'),gallery=new Node('spatial-card-gallery',{cardGallery:'about-gallery',galleryIndex:'0'});gallery.append(card('one',true),card('two',true));about.append(gallery);this.replaceChildren(about);}else if(value==='home'){homesBuilt++;this.replaceChildren(new Node('home-hero'),card('one'),card('two'));if(homeGallery){const gallery=new Node('spatial-card-gallery',{cardGallery:'home-projects',galleryIndex:'0'});for(const id of ['one','two']){const item=new Node('spatial-gallery-item',{galleryItem:''});item.append(card(id,true));gallery.append(item);}this.append(gallery);}}else{detailsBuilt++;this.replaceChildren(detail(value.slice(7)),new Node('detail-footer'));}}});
 class Layout{
  constructor(root,projects,options){Object.assign(this,options,{mode:options.mode,root,dead:false});}
  pause(){this.paused=true;}resume(){this.paused=false;}destroy(){this.dead=true;}flush(){}holdCard(){}apply(options){Object.assign(this,options);}setProductDisplay(value){this.productDisplay=value;}setHeroContent(value){this.heroContent=value;}setTimelineMode(value){this.timelineMode=value;}setHeroCarousel(value){this.heroCarousel=value;}
 }
 class Stream{constructor(){this.dead=false;}pause(){this.paused=true;}resume(){this.paused=false;}destroy(){this.dead=true;}}
 const reveals=()=>({dead:false,pause(){this.paused=true;},resume(){this.paused=false;},start(){},cancel(){this.dead=true;}});
 const projects=[{id:'one'},{id:'two'}],noop=()=>{},memory=new AssistantNavigationMemory(),morphs=[],assistantStates=[];
 const env={previewProjectTarget:null,previewProjectOrigin:null,previewReturnProxy:()=>null,fadeOutProxy(){},fadeUpIn:noop,informationCards:[],returnHomeFromInformation(){throw Error('Information return unexpectedly used the fade path');},contextualButtons:'inline',contextualComposer:false,composerContext:null,projectEntry:new ProjectEntryMemory(),galleryProjectTarget:null,galleryProjectOrigin:null,cardGalleries:[],pageTimelines:[],homeProductDisplay:homeGallery?'carousel':'cards',main,current:'',cards:[...projects,{id:'about',body:['About']}],projects,homeProjects:projects,canonicalProjectRoute:id=>id,projectIds:['one','two'],cardIds:['one','two','about'],homeView:'current',layout:'masonry',homeColumns:2,oneColumnPosition:'top',multiColumnPosition:'top',showCardCopyOnHover:false,heroContent:'timeline',heroTimelineMode:'cursor',heroCarouselEnabled:false,homeCarouselState:{},detailHeadingBeside:false,homeScroll:0,scrollY:0,scrollingMaterial:false,homeScene:null,homeLayout:null,assistantProjectOrigin:null,assistantProjectTarget:null,navSlideTarget:null,homeOpenTarget:null,travelDirection:0,busy:false,navigationPreparing:false,instances:[],hoverEffects:[],summaryStream:null,detailContentReveal:null,activeTransition:null,chromeTransition:false,duration:400,slow:false,intensity:.7,reduce:{matches:false},location:{hash:'#work'},document:doc,innerWidth:1920,innerHeight:1080,
  $:selector=>selector==='#back'?null:selector==='#askPage'?ask:getControl(selector),homeMarkup:()=> 'home',cardDetail:p=>p.id==='about'?'about':'detail:'+p.id,HomeLayout:Layout,SummaryStream:Stream,createDetailContentReveal:reveals,projectRevealMode:()=> 'stream',TransitionControl,morphProgress,neighborPush,cardNavigation,retainHome,clearImageHandoffs,stageHomeReturn:()=>noop,assistantNavigation:memory,
  mediaFocus:{destroy:noop},motionMaterial:{start:noop,stop:noop},homeSections:{sync:noop},dockMorph:{setBack:noop,setSplit:noop},edgeShades:{animateTo:noop,sync:noop},showBackControl:()=>true,showProjectControls:()=>true,ambientMovementEnabled:()=>false,pulseImages:noop,applyCardAppearance:noop,applyContentWidths:noop,syncRouteChrome:noop,attachHoverEffects:noop,homeScrollMotion:noop,refreshImageFrames:noop,
  snapshot:element=>element?{element,rect:element.rect}:null,freeze:element=>({clone:element.cloneNode(true)}),navigateAssistant(){throw Error('Shared Chat return incorrectly bypassed the card morph');},
  portfolioAssistant:{prepareNavigation:async()=>{},setActive(active,options){ask.hidden=!active;assistantStates.push({active,...options});}},
  window:{scrollTo({top}){env.scrollY=top;}},history:{replaceState(a,b,hash){env.location.hash=hash;}},
  enhance(){env.instances=main.querySelectorAll('.visual').map(visual=>({visual,suspended:false,dead:false,suspend(){this.suspended=true;},resume(){this.suspended=false;},destroy(){this.dead=true;}}));},
  disposeGalleryOrigin(){if(env.galleryProjectOrigin?.scene){env.galleryProjectOrigin.galleries.forEach(g=>g.destroy());env.galleryProjectOrigin.scene.dispose();}env.galleryProjectOrigin=null;},async slideCards(){},
  morph(source,target){assert(source&&target);assert.equal(target.visual.img.naturalWidth,1000,'The destination must already have decoded geometry, not a new pending image');morphs.push({source:source.element,target});return new Promise(resolve=>queueMicrotask(()=>{const control=env.activeTransition;let time=0;control.advance(time);for(let i=0;!control.timeline.finished&&i<100;i++){time+=16;control.advance(time);if(env.reverseOpening&&env.current==='one'&&control.timeline.value>.3){env.reverseOpening=false;control.reverse();}if(env.reverseClose&&env.current!=='one'&&env.current!=='two'&&control.timeline.value>.3){env.reverseClose=false;control.reverse();}}resolve();}));}
 };
 for(const name of Object.keys(code)){const fn=compile(code[name]);env[name]=(...args)=>fn(env,args);}
 return {env,main,messages,morphs,assistantStates,card,detail,get homesBuilt(){return homesBuilt;},get detailsBuilt(){return detailsBuilt;}};
}
for(const reverseClose of [false,true]){
 const f=fixture(),e=f.env;e.render('work');const originals=f.main.querySelectorAll('[data-card]'),images=[...e.instances],layout=e.homeLayout;
 originals.forEach(card=>card.visual.img.naturalWidth=1000);e.homeOpenTarget='one';e.location.hash='#one';await e.navigate();
 assert(e.homeScene,'A completed open retains the original grid');assert(images.every(image=>image.suspended&&!image.dead),'Hidden home releases rendering without destroying native image frames');assert(!layout.dead);
 const opened=f.main.querySelector('.detail'),paragraph=e.summaryStream,reveal=e.detailContentReveal;
 e.reverseClose=reverseClose;e.location.hash='#work';await e.navigate();
 if(reverseClose){
  assert.equal(f.main.querySelector('.detail'),opened,'Escape during closing restores the same live detail instead of rendering it again');assert.equal(e.summaryStream,paragraph);assert(!paragraph.dead&&!paragraph.paused);assert.equal(e.detailContentReveal,reveal);assert(!reveal.dead&&!reveal.paused);assert(e.homeScene);e.location.hash='#work';await e.navigate();
 }
 assert.equal(f.homesBuilt,1,'The completed open → close cycle never rebuilds the grid');assert.equal(f.detailsBuilt,1);assert.deepEqual(f.main.querySelectorAll('[data-card]'),originals);assert.deepEqual(e.instances,images);assert(images.every(image=>!image.dead&&!image.suspended));assert.equal(e.homeLayout,layout);assert(!e.homeScene);
 assert.equal(f.morphs.at(-1).target,originals[0]);assert.equal(e.current,'work');assert.equal(e.busy,false);
}
// A project reached by link or refresh has no home card to morph into, so it leaves with the page fade instead.
{
 const f=fixture(),e=f.env;let fades=0;e.returnHomeWithoutOrigin=async()=>{fades++;};e.recoverNavigation=error=>{throw error;};
 e.render('one');e.current='one';e.location.hash='#one';const morphs=f.morphs.length;e.location.hash='#work';await e.navigate();assert.equal(fades,1,'Direct project return uses the fade fallback');assert.equal(f.morphs.length,morphs,'No morph aims at a missing home card');
}
// Navigating to another project still returns into that original grid card.
{
 const f=fixture(),e=f.env;e.render('work');const original=f.main.querySelector('[data-card="two"]');f.main.querySelectorAll('[data-card]').forEach(card=>card.visual.img.naturalWidth=1000);
 e.location.hash='#one';await e.navigate();e.location.hash='#two';await e.navigate();e.location.hash='#work';await e.navigate();assert.equal(f.morphs.at(-1).target,original);assert.equal(f.homesBuilt,1);
}
for(const reverseClose of [false,true]){
 const f=fixture(),e=f.env,card=f.card('one',true);f.messages.append(card);e.current='assistant';f.main.hidden=true;e.scrollY=640;e.assistantProjectTarget=card;e.location.hash='#one';await e.navigate();const opened=f.main.querySelector('.detail');
 assert.equal(e.assistantProjectOrigin.element,card);e.assistantNavigation.backTarget('one');e.reverseClose=reverseClose;e.location.hash='#assistant';await e.navigate();
 if(reverseClose){assert.equal(f.main.querySelector('.detail'),opened);assert(e.assistantNavigation.returnToChat);e.assistantNavigation.backTarget('one');e.location.hash='#assistant';await e.navigate();}
 assert.equal(f.morphs.at(-1).target,card,'Chat close uses the shared morph into the actual original response card');assert.equal(e.current,'assistant');assert.equal(e.scrollY,640);assert.equal(e.assistantProjectOrigin,null);
 assert(f.assistantStates.filter(state=>state.active).every(state=>state.scroll===false&&state.focus===false),'A shared Chat return cannot race auto-scroll or keyboard focus against its measured endpoint');
}
console.log('Card return lifecycle passed: completed open/close, original decoded card/frame identity, project switching, interrupted close restoration, shared Chat return and scroll/focus isolation.');

for(const reverseClose of [false,true]){
 const f=fixture(),e=f.env;e.render('about');const source=f.main.querySelector('[data-content-card="one"]'),root=source.closest('[data-card-gallery]');
 const gallery={root,dead:false,destroy(){this.dead=true;}};e.cardGalleries=[gallery];const images=[...e.instances];e.scrollY=420;e.galleryProjectTarget=source;e.location.hash='#one';await e.navigate();
 assert.equal(f.morphs[0].source,source,'A gallery opens from the selected card instead of the About page');assert(e.galleryProjectOrigin.scene);assert.equal(e.projectEntry.backTarget('one',e.projectIds),'about');assert(!gallery.dead);assert(images.every(img=>!img.dead&&img.suspended));
 e.reverseClose=reverseClose;e.location.hash='#about';await e.navigate();if(reverseClose){assert.equal(e.current,'one');assert(e.galleryProjectOrigin.scene);assert.equal(e.projectEntry.route,'about');e.location.hash='#about';await e.navigate();}
 assert.equal(e.current,'about');assert.equal(e.scrollY,420);assert.equal(f.morphs.at(-1).target,source);assert.equal(f.main.querySelector('[data-content-card="one"]'),source);assert.equal(e.cardGalleries[0],gallery);assert(!gallery.dead);assert(images.every(img=>!img.dead&&!img.suspended));assert.equal(e.galleryProjectOrigin,null);assert.equal(e.projectEntry.route,null);assert.equal(f.detailsBuilt,2,'Returning never rebuilds the About page or its carousel');
}
{
 const f=fixture(),e=f.env;e.render('about');const source=f.main.querySelector('[data-content-card="one"]'),root=source.closest('[data-card-gallery]'),gallery={root,dead:false,destroy(){this.dead=true;}};e.cardGalleries=[gallery];e.scrollY=310;e.reverseOpening=true;e.galleryProjectTarget=source;e.location.hash='#one';await e.navigate();
 assert.equal(e.current,'about');assert.equal(e.scrollY,310);assert.equal(e.galleryProjectOrigin,null);assert.equal(e.projectEntry.route,null);assert.equal(f.main.querySelector('[data-content-card="one"]'),source);assert.equal(e.cardGalleries[0],gallery);assert(!gallery.dead,'Escape mid-opening restores the original live carousel');
}
console.log('Gallery return lifecycle passed: selected card source, retained page/controllers/images, exact scroll restoration, shared docking target, and Escape during both opening and closing.');

for(const interruption of ['none','opening','closing']){
 const f=fixture({homeGallery:true}),e=f.env;e.render('work');const source=f.main.querySelector('[data-content-card="one"]'),root=source.closest('[data-card-gallery]');
 const gallery={root,dead:false,destroy(){this.dead=true;}};e.cardGalleries=[gallery];const images=[...e.instances],layout=e.homeLayout;e.scrollY=390;e.galleryProjectTarget=source;e.reverseOpening=interruption==='opening';e.location.hash='#one';await e.navigate();
 if(interruption!=='opening'){assert(e.homeScene);assert(!gallery.dead);assert(images.every(image=>!image.dead&&image.suspended));e.reverseClose=interruption==='closing';e.location.hash='#work';await e.navigate();if(interruption==='closing'){assert.equal(e.current,'one');assert(e.homeScene);assert(!gallery.dead);e.location.hash='#work';await e.navigate();}}
 assert.equal(e.current,'work');assert.equal(e.scrollY,390);assert.equal(f.main.querySelector('[data-content-card="one"]'),source);assert.equal(e.cardGalleries[0],gallery);assert.equal(e.homeLayout,layout);assert(!gallery.dead);assert(images.every(image=>!image.dead&&!image.suspended));assert.equal(f.homesBuilt,1);assert.equal(e.projectEntry.route,null);
 if(interruption!=='opening')assert.equal(f.morphs.at(-1).target,source,'Return docks into the actual carousel card, rather than its hidden grid counterpart');
}
console.log('Homepage carousel lifecycle passed: exact source card, live gallery/controller/image retention, original scroll, and Escape while opening or closing.');

// About and Contact have no home card: About returns by reversing the same slide used by the menu.
{
 const entry=fixture(),x=entry.env;let fadeCount=0,aboutSlide=null;x.fadeUpIn=()=>{fadeCount++;};x.slideCards=async(old,direction)=>{aboutSlide={direction,route:x.current};};x.informationCards=[{id:'about'}];x.render('work');x.location.hash='#about';await x.navigate();assert.deepEqual(aboutSlide,{direction:1,route:'about'});assert.equal(fadeCount,0,'About entrance does not replay a second fade after its route transition');
 const f=fixture(),e=f.env,returnSlides=[];e.informationCards=[{id:'about'}];e.slideCards=async(old,direction)=>{returnSlides.push(direction);};
 e.render('about');e.location.hash='#work';await e.navigate();
 assert.deepEqual(returnSlides,[-1],'Go Back from About reverses the entrance slide');assert.equal(f.morphs.length,0,'No title morph runs without an About card in the grid');
 const slides=[],g=fixture(),h=g.env;h.informationCards=[{id:'about'}];h.slideCards=async(old,direction)=>{slides.push(direction);};h.returnHomeFromInformation=()=>{throw Error('Menu Home must slide, not fade');};
 h.render('about');h.navSlideTarget='work';h.travelDirection=-1;h.location.hash='#work';await h.navigate();
 assert.deepEqual(slides,[-1],'Menu Home from About slides the homepage in from the left');assert.equal(g.morphs.length,0);
}
console.log('Information return passed: About entrance and reverse slide, matching menu Home direction, and no title morph.');

// About's incoming slide combines opacity and upward motion in one animation.
{
 const {env,main}=fixture();env.current='about';env.pageEntranceLift=14;env.pulseImages=()=>{};env.stageMotion=()=>()=>{};env.innerWidth=1000;env.activeTransition={track(animation){return animation;}};
 const frames=[],animation=keyframes=>{frames.push(keyframes);return {finished:Promise.resolve()};};main.animate=animation;
 const old={clone:{style:{},animate:animation}};await env.slideCardsImplementation(old,1);
 assert.deepEqual(frames[1],[{opacity:0,transform:'translate3d(1048px,14px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],'About fades and lifts as its page enters, in the same motion as the outgoing page');
}

// Stepping Next/Previous from a carousel-opened detail turns the hidden carousel with it.
{
 const card=id=>({id}),item=id=>({card:card(id),querySelector(selector){return selector===`[data-content-card="${id}"]`?this.card:null;}});
 const items=['one','two','three','one-copy','four'].map(id=>item(id==='one-copy'?'one':id));
 const moves=[],gallery={root:{dataset:{cardGallery:'home-projects'},querySelectorAll:()=>items},go(index,smooth){moves.push({index,smooth});},paint(){moves.push('paint');}};
 const env={projectIds:['one','two','three','four'],homeScene:{scene:{galleries:[gallery]}},galleryProjectOrigin:{route:'work',project:'one',index:0,element:items[0].card,galleryId:'home-projects',galleries:[]}};
 for(const name of ['galleryOriginTarget','syncGalleryOrigin']){const fn=compile(code[name]);env[name]=(...args)=>fn(env,args);}
 env.syncGalleryOrigin('two');
 assert.deepEqual(moves,[{index:1,smooth:false},'paint'],'Next turns the background carousel instantly to the new project');
 assert.equal(env.galleryProjectOrigin.element,items[1].card,'Back docks into the newly centred card');assert.equal(env.galleryProjectOrigin.project,'two');
 env.syncGalleryOrigin('three');env.syncGalleryOrigin('one');
 assert.equal(env.galleryProjectOrigin.index,3,'A repeated project resolves to the copy nearest the current position');
 moves.length=0;env.syncGalleryOrigin('one');env.syncGalleryOrigin('missing');assert.equal(moves.length,0,'Same or unknown projects leave the carousel alone');
}
console.log('Carousel origin sync passed: background carousel follows Next/Previous and Back docks into the centred card.');

// A row clicked while its hover thumbnail shows opens from that thumbnail and returns into the
// thumbnail of whichever project is open by then, without pushing or pulling the home cards.
{
 const f=fixture(),e=f.env;e.render('work');const proxyIn=new Node('preview-morph-proxy');proxyIn.root=true;const pushes=[];e.pushCards=(...args)=>{pushes.push(args);return Promise.resolve();};
 e.previewProjectTarget=proxyIn;e.homeOpenTarget='one';e.location.hash='#one';await e.navigate();
 assert.equal(f.morphs[0].source,proxyIn,'The detail opens from the hover thumbnail');assert.equal(pushes.length,0,'Home cards stay put for a thumbnail open');
 assert.equal(proxyIn.style.visibility,'hidden','The thumbnail stand-in hides while its image flies');assert.deepEqual(e.previewProjectOrigin,{project:'one'});assert.equal(e.previewProjectTarget,null);
 const proxyOut=new Node('preview-morph-proxy');proxyOut.visual={img:{naturalWidth:1000}};let faded=null,asked=null;e.previewReturnProxy=(root,project)=>{asked=project.id;return proxyOut;};e.fadeOutProxy=proxy=>{faded=proxy;};
 e.location.hash='#work';await e.navigate();
 assert.equal(asked,'one','Back docks into the thumbnail of the project that is open');assert.equal(f.morphs.at(-1).target,proxyOut);assert.equal(faded,proxyOut,'The docked thumbnail fades away afterwards');
 assert.equal(pushes.length,0,'Home cards stay put for a thumbnail return');assert.equal(e.previewProjectOrigin,null,'Leaving projects clears the thumbnail origin');
}
console.log('Thumbnail morph passed: opens from the hover thumbnail and docks back into the current project thumbnail.');
