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
assert.equal(requests[0].priority,'high');assert.equal(requests[1].priority,'low');assert.equal(requests[0].sizes,'300px','Responsive candidates match the fitted image, not a full-width screen');
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
