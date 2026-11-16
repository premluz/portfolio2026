import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {imageMarkup,MediaLoader} from '../dist/media-loading.js';
import {imageVariants} from '../dist/image-variants.js';

const url=Object.keys(imageVariants)[0],deferred=imageMarkup(url,'A "screen"'),eager=imageMarkup(url,'Screen',{eager:true});
assert(deferred.includes('data-media-src=')&&!deferred.includes(' src="')&&!deferred.includes(' srcset="'),'Card markup cannot fetch its source before visibility is known');
assert(eager.includes(' src="')&&eager.includes(' srcset="')&&eager.includes('fetchpriority="high"'),'Direct project entry prioritises its hero immediately');
assert(deferred.includes('width="'+imageVariants[url].width+'"')&&deferred.includes('height="'+imageVariants[url].height+'"'),'Source dimensions reserve the image proportions before bytes arrive');
assert(deferred.includes('&quot;screen&quot;'));

let observer,nextFrame=0;const frames=new Map(),requests=[],listeners=new Map(),documentListeners=new Map();
const env={innerWidth:1000,innerHeight:800,getComputedStyle:node=>({visibility:node.hidden?'hidden':'visible'}),requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id),addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),document:{addEventListener:(key,fn)=>documentListeners.set(key,fn),removeEventListener:key=>documentListeners.delete(key)},IntersectionObserver:class{constructor(callback,options){this.callback=callback;this.options=options;this.observed=new Set();observer=this;}observe(node){this.observed.add(node);}unobserve(node){this.observed.delete(node);}disconnect(){this.observed.clear();}}};
const step=()=>{const work=[...frames.values()];frames.clear();work.forEach(fn=>fn());};
function media(name,{top=100,hidden=false,primary=false,video=false}={}){
 const node={name,tagName:video?'VIDEO':'IMG',isConnected:true,hidden,top,style:{width:'300px'},dataset:{mediaSrc:name+'.webp',...(!video?{mediaSrcset:name+'-480.webp 480w, '+name+'-960.webp 960w',mediaSizes:'90vw'}:{mediaPoster:name+'-poster.webp'})},attributes:{'data-media-pending':''},loading:'lazy',preload:'none',
 closest(selector){if(selector.startsWith('[hidden]'))return this.hidden?{}:null;if(selector.startsWith('.detail-media-column'))return primary?{}:null;if(selector==='.visual')return {getBoundingClientRect:()=>({width:360})};return null;},
 getBoundingClientRect(){return {top:this.top,bottom:this.top+200,left:100,right:400,width:300,height:200};},removeAttribute(key){delete this.attributes[key];}};
 Object.defineProperty(node,'src',{get(){return this.source||'';},set(value){this.source=value;requests.push({name,src:value,priority:this.fetchPriority,sizes:this.sizes,poster:this.poster});}});return node;
}
const hidden=media('hidden',{hidden:true}),below=media('below',{top:2000}),neighbour=media('neighbour'),hero=media('hero',{primary:true}),video=media('film',{video:true,top:2200});
const nodes=[hidden,below,neighbour,hero,video],root={querySelectorAll:selector=>selector.includes('data-media-src]')?nodes.filter(node=>node.dataset.mediaSrc):nodes.filter(node=>'data-media-pending' in node.attributes)};
const loader=new MediaLoader({environment:env});loader.refresh(root);step();
assert.deepEqual(requests.map(item=>item.name),['hero','neighbour'],'The hero requests first, while hidden layouts and below-fold media remain unloaded');
assert.equal(requests[0].priority,'high');assert.equal(requests[1].priority,'high','The two largest on-screen images both load at high priority (LEAD_IMAGES)');assert.equal(requests[0].sizes,'300px','Responsive candidates match the fitted image, not a full-width screen');
assert.equal(hero.loading,'eager');assert(!video.poster&&!video.src);
documentListeners.get('load')({target:hero});assert(!('data-media-pending' in hero.attributes));
observer.callback([{target:below,isIntersecting:true},{target:hidden,isIntersecting:true},{target:video,isIntersecting:false}]);assert.equal(below.src,'below.webp');assert(!hidden.src&&!video.src);
video.top=500;observer.callback([{target:video,isIntersecting:true}]);assert.equal(video.poster,'film-poster.webp');assert.equal(video.preload,'none','Assigning a visible video preserves play-on-demand instead of preloading the film');
hidden.hidden=false;loader.refresh(root);step();assert.equal(hidden.src,'hidden.webp','Switching layouts can activate previously deferred images');
const count=requests.length;loader.refresh(root);step();assert.equal(requests.length,count,'Refresh and gallery selection never issue duplicate requests');
loader.destroy();assert.equal(observer.observed.size,0);assert.equal(documentListeners.size,0);assert.equal(frames.size,0);

// A rebuilt page (simple transitions) gets fresh <img> elements; one live image per loaded URL keeps them in memory.
const kept=[];class KeptImage{set src(value){this.url=value;kept.push(value);}}
const pooling=new MediaLoader({environment:{...env,Image:KeptImage}}),loaded=url=>({tagName:'IMG',currentSrc:url,removeAttribute(){}});
documentListeners.get('load')({type:'load',target:loaded('card-960.webp')});documentListeners.get('load')({type:'load',target:loaded('card-960.webp')});
documentListeners.get('error')({type:'error',target:loaded('broken.webp')});
assert.deepEqual(kept,['card-960.webp'],'Each loaded URL is held once; failed loads are not held');
pooling.destroy();assert.equal(pooling.decoded.size,0,'Destroy releases held images');

// Older browsers use the same bounds check on scroll rather than loading every image.
const fallbackNode=media('fallback',{top:2000}),fallbackRoot={querySelectorAll:()=>[fallbackNode]},fallback=new MediaLoader({environment:{...env,IntersectionObserver:null}});fallback.refresh(fallbackRoot);step();assert(!fallbackNode.src);fallbackNode.top=400;listeners.get('scroll')();step();assert.equal(fallbackNode.src,'fallback.webp');fallback.destroy();assert.equal(listeners.size,0);

let originals=0,responsive=0;
for(const [original,meta] of Object.entries(imageVariants)){
 assert(meta.width>0&&meta.height>0&&meta.variants.length>0);
 originals+=(await stat(new URL('../dist/'+original,import.meta.url))).size;
 for(const variant of meta.variants){const bytes=await readFile(new URL('../dist/'+variant.url,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert(variant.width<=meta.width);}
 responsive+=(await stat(new URL('../dist/'+meta.variants.at(-1).url,import.meta.url))).size;
}
assert(responsive<originals,'Even the largest responsive copies reduce total image bytes');
console.log('Media loading passed: visible hero priority, hidden/below-fold deferral, responsive fitting, video-on-demand, repeat requests, fallback, cleanup and WebP assets.');

// Media reveal (Settings → Fade images in): fresh loads fade, below-fold images wait for the viewport, backdrops and morph targets never fade.
{
 const observers=[],docListeners=new Map();
 const revealEnv=(on,{bridge=false}={})=>({innerWidth:1000,innerHeight:800,matchMedia:()=>({matches:false}),getComputedStyle:()=>({visibility:'visible'}),requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},addEventListener:()=>{},removeEventListener:()=>{},
  document:{documentElement:{dataset:{mediaReveal:on?'on':'off'}},addEventListener:(key,fn)=>docListeners.set(key,fn),removeEventListener:key=>docListeners.delete(key)},
  IntersectionObserver:class{constructor(callback,options){this.callback=callback;this.options=options;this.observed=new Set();observers.push(this);}observe(node){this.observed.add(node);}unobserve(node){this.observed.delete(node);}disconnect(){this.observed.clear();}},bridge});
 const image=(name,top,{backdrop=false,bridge=false}={})=>({name,tagName:'IMG',isConnected:true,top,style:{},dataset:{mediaSrc:name+'.webp'},attributes:{'data-media-pending':''},
  hasAttribute(key){return key in this.attributes;},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];},
  closest(selector){if(selector==='.card-backdrop')return backdrop?{}:null;if(selector==='.visual')return backdrop?null:{getBoundingClientRect:()=>({width:300}),querySelector:key=>key==='.morph-image-bridge'&&bridge?{}:null};return null;},
  getBoundingClientRect(){return {top:this.top,bottom:this.top+200,left:0,right:300,width:300,height:200};}});
 const scene=nodes=>({querySelectorAll:selector=>selector.includes('data-media-src]')?nodes.filter(node=>node.dataset.mediaSrc):[]});

 const inView=image('in-view',100),below=image('below',2000),backdrop=image('backdrop',2000,{backdrop:true});
 const loader=new MediaLoader({environment:revealEnv(true)});loader.refresh(scene([inView,below,backdrop]));
 const seen=observers.find(item=>item.options.rootMargin==='0px 0px -6% 0px');
 assert('data-media-waiting' in below.attributes&&!('data-media-waiting' in inView.attributes)&&!('data-media-waiting' in backdrop.attributes),'Only content images below the fold wait for the viewport');
 docListeners.get('load')({type:'load',target:inView});
 assert('data-media-fade' in inView.attributes&&!('data-media-pending' in inView.attributes),'A freshly loaded image fades in');
 docListeners.get('animationend')({animationName:'media-reveal',target:inView});assert(!('data-media-fade' in inView.attributes),'The fade marker clears when the fade ends');
 docListeners.get('load')({type:'load',target:below});
 assert(!('data-media-fade' in below.attributes)&&'data-media-waiting' in below.attributes,'An image that loads before it is in view waits, unfaded');
 seen.callback([{target:below,isIntersecting:true}]);
 assert('data-media-fade' in below.attributes&&!('data-media-waiting' in below.attributes)&&!seen.observed.has(below),'Scrolling it into view fades it in once');
 docListeners.get('load')({type:'load',target:backdrop});assert(!('data-media-fade' in backdrop.attributes),'Backdrops keep their own entrance');
 loader.destroy();assert(!docListeners.has('animationend'),'Destroy removes the fade listener');

 const morph=image('morph',100,{bridge:true}),offImage=image('off',2000);
 const bridged=new MediaLoader({environment:revealEnv(true)});bridged.refresh(scene([morph]));docListeners.get('load')({type:'load',target:morph});
 assert(!('data-media-fade' in morph.attributes),'A morph target under its bridge image does not fade (no dip)');bridged.destroy();
 const off=new MediaLoader({environment:revealEnv(false)});off.refresh(scene([offImage]));docListeners.get('load')({type:'load',target:offImage});
 assert(!('data-media-waiting' in offImage.attributes)&&!('data-media-fade' in offImage.attributes),'With the setting off, images appear as before');off.destroy();
}

// Lead images: the two largest on screen load at once (no frame wait) at high priority; the rest follow at low.
{
 const frames=[],loads=[];
 const env={innerWidth:1440,innerHeight:900,getComputedStyle:()=>({visibility:'visible'}),requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame:()=>{},addEventListener:()=>{},removeEventListener:()=>{},document:{addEventListener:()=>{},removeEventListener:()=>{}},
  IntersectionObserver:class{constructor(callback){this.callback=callback;}observe(){}unobserve(){}disconnect(){}}};
 const img=(name,width,{top=100,backdrop=false}={})=>{const node={name,tagName:'IMG',isConnected:true,style:{},dataset:{mediaSrc:name+'.webp'},attributes:{},
  hasAttribute(key){return key in this.attributes;},setAttribute(){},removeAttribute(){},
  closest(selector){return selector==='.card-backdrop'&&backdrop?{}:null;},getBoundingClientRect:()=>({top,bottom:top+300,left:0,right:width,width,height:300})};
  Object.defineProperty(node,'src',{set(value){loads.push([name,this.fetchPriority]);}});return node;};
 const small=img('small',200),large=img('large',900),medium=img('medium',600),offside=img('offside',1400,{top:100}),backdrop=img('backdrop',1440,{backdrop:true}),below=img('below',900,{top:1200});
 offside.getBoundingClientRect=()=>({top:100,bottom:400,left:-1200,right:200,width:1400,height:300});
 const nodes=[small,large,medium,offside,backdrop,below],loader=new MediaLoader({environment:env});
 loader.refresh({querySelectorAll:selector=>selector.includes('data-media-src]')?nodes.filter(node=>node.dataset.mediaSrc):[]});
 assert.deepEqual(loads,[['large','high'],['medium','high']],'The two largest on-screen images load immediately at high priority; backdrops and below-fold images do not jump the queue');
 frames.splice(0).forEach(fn=>fn());assert.deepEqual(loads.slice(2).map(([name])=>name).sort(),['backdrop','offside','small'],'Other on-screen images follow (a wide card mostly off screen ranks by its visible part); below the fold waits');assert(loads.slice(2).every(([,priority])=>priority==='low'));
 const count=loads.length,late=img('late',1000);loader.refresh({querySelectorAll:selector=>selector.includes('data-media-src]')?[late]:[]});assert.equal(loads.length,count,'Leads are chosen once per view, not on every refresh');
 frames.splice(0).forEach(fn=>fn());assert.deepEqual(loads.at(-1),['late','low'],'A later on-screen image loads through the normal queue');
 loader.destroy();
}
