import assert from 'node:assert/strict';
import {timelineMarkup,timelineTarget,timelineDrag,HeroTimeline} from '../dist/hero-timeline.js';
import {homeHero} from '../dist/home-content.js';
import {contentModel} from '../dist/content/model.js';
import {catalog} from '../dist/content/catalog.js';
import {createBlockRenderer} from '../dist/content-blocks.js';
const home=catalog.documents.find(doc=>doc.id==='home'),block=home.blocks.find(b=>b.type==='timeline');
assert.equal(contentModel.validate(catalog).length,0);
const paragraphHero=homeHero({heroContent:'paragraph'});
{const intro=home.blocks.find(b=>b.id==='home-introduction');const heading=paragraphHero.match(/<h1 data-hero-title>[^]*?<\/h1>/)?.[0]||'',titleText=intro.title.replace(/<[^>]+>/g,'').trim();assert(heading.includes(`<span class="hero-greeting">${intro.label}</span>`)&&heading.replace(/<[^>]+>/g,'').includes(titleText),'Greeting and authored title share one H1, including any authored line break');}
assert(paragraphHero.includes(home.blocks.find(b=>b.id==='home-description').paragraphs[0].split(' ').slice(0,6).join(' ')),'Description mode uses its own authored content block');assert(!paragraphHero.includes('data-hero-timeline'),'Description format omits timeline UI');
const bothHero=homeHero({heroContent:{timeline:true,description:true}});assert(bothHero.includes('data-hero-timeline')&&bothHero.includes('data-hero-description'),'Timeline and description render as independently selected content');assert(bothHero.includes('data-hero-combined-content="true"'),'The combined hero state is explicit at first paint');
const emptyHero=homeHero({heroContent:{timeline:false,description:false}});assert(!emptyHero.includes('data-hero-timeline')&&!emptyHero.includes('data-hero-description'),'Both hero content types can be hidden');
const heroStyles=await (await import('node:fs/promises')).readFile(new URL('../dist/content-widths.css',import.meta.url),'utf8');
assert(heroStyles.includes('.home-canvas:not(.home-view-split) .hero-copy>[data-hero-description]{grid-column:2;')&&heroStyles.includes('.home-canvas:not(.home-view-split) .hero-copy>[data-hero-timeline]{grid-column:1 / -1}'),'Home lead copy occupies the middle third while the timeline spans the width');
assert.equal(block.items.length,5);assert(homeHero().includes('data-hero-timeline'));
assert(createBlockRenderer()([block]).includes('data-timeline-item="technical-users"'),'The typed timeline works outside the hero too');
const more=structuredClone(catalog);more.documents.find(doc=>doc.id==='home').blocks.find(b=>b.type==='timeline').items.push({id:'next-chapter',type:'text',paragraphs:['A new chapter.']});
assert.equal(contentModel.validate(more).length,0,'Adding a typed item requires no renderer change');
const unsafe=structuredClone(catalog);unsafe.documents.find(doc=>doc.id==='home').blocks.find(b=>b.type==='timeline').items.push({id:'bad',type:'info-card',title:'Bad',link:{id:'unsafe',label:'Bad',url:'javascript:alert(1)'}});
assert(contentModel.validate(unsafe).some(issue=>issue.includes('unsafe link')));
assert(!timelineMarkup({items:[{id:'escaped',paragraphs:['<script>bad</script>'],link:{label:'bad',url:'javascript:alert(1)'}}]}).includes('<script>'));
assert.equal(timelineTarget(-10,{left:20,width:600},1200),0);
assert.equal(timelineTarget(1000,{left:20,width:600},1200),1200);
assert.equal(timelineDrag(100,0,30,1200,600),160);
assert.equal(timelineDrag(100,0,-300,1200,600),0);
class Element {
 constructor(){this.events=new Map();this.dataset={};this.attrs={};this.style={setProperty:(k,v)=>this.style[k]=v};}
 addEventListener(type,fn){this.events.set(type,fn);}
 setAttribute(k,v){this.attrs[k]=v;}
 closest(selector){return this.selectors?.includes(selector)?this:null;}
}
const root=new Element(),viewport=new Element(),handle=new Element(),instruction=new Element();
Object.assign(viewport,{scrollLeft:0,scrollWidth:1800,clientWidth:600,firstElementChild:new Element(),getBoundingClientRect:()=>({left:100,width:600})});
handle.selectors=['[data-timeline-handle]'];
root.querySelector=selector=>({'[data-timeline-viewport]':viewport,'[data-timeline-handle]':handle,'[data-timeline-instruction]':instruction,'[data-timeline-item]':{getBoundingClientRect:()=>({width:300})}}[selector]);
root.setPointerCapture=id=>root.capture=id;root.hasPointerCapture=id=>root.capture===id;root.releasePointerCapture=()=>root.capture=null;
let id=0,now=0;const callbacks=new Map();globalThis.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id;};globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
const pump=()=>{for(let i=0;i<100&&callbacks.size;i++){now+=16.667;const batch=[...callbacks.values()];callbacks.clear();batch.forEach(fn=>fn(now));}};
const event=(x,target=root,extra={})=>({clientX:x,target,pointerType:'mouse',pointerId:1,button:0,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra});
const timeline=new HeroTimeline(root);
timeline.move(event(400));pump();assert.equal(viewport.scrollLeft,600);assert.equal(handle.attrs['aria-valuenow'],'50');assert.equal(callbacks.size,0,'Cursor interpolation stops at rest');
timeline.setMode('drag');timeline.move(event(700));assert.equal(viewport.scrollLeft,600,'Drag mode ignores passive cursor motion');
timeline.down(event(400));timeline.move(event(300));assert.equal(viewport.scrollLeft,700,'Content follows the hand during a drag');timeline.release(event(300));assert.equal(root.capture,null);
timeline.down(event(300,handle));timeline.move(event(400,handle));assert(viewport.scrollLeft>850,'Handle travel scrolls in the scrubber direction');timeline.setMode('cursor');assert.equal(root.capture,null,'Mode changes release an active grab');
const touch=event(200,root,{pointerType:'touch'});timeline.down(touch);assert.equal(timeline.drag,null,'Touch content keeps native scrolling');timeline.move(touch);assert.equal(callbacks.size,0);
const key=event(0,handle,{key:'Home'});timeline.key(key);pump();assert.equal(viewport.scrollLeft,0);assert(key.prevented&&key.stopped,'Timeline keys cannot also change projects');
timeline.down(event(200,handle,{pointerType:'touch'}));assert(timeline.drag,'The dot supports touch capture');timeline.release(event(200,handle,{pointerType:'touch'}));
timeline.aim(1000);assert(callbacks.size);timeline.destroy();assert.equal(callbacks.size,0,'Cleanup cancels outstanding animation work');
const reduced=new HeroTimeline(root,{reduced:()=>true});reduced.aim(800);assert.equal(viewport.scrollLeft,800);assert.equal(callbacks.size,0);reduced.destroy();
const graphicOnly=timelineMarkup(block,{text:false}),textOnly=timelineMarkup(block,{graphic:false});
assert(graphicOnly.includes('timeline-rule')&&graphicOnly.includes('data-timeline-handle')&&!graphicOnly.includes('<p>')&&!graphicOnly.includes('<a '),'Graphic-only timeline drops the text but keeps the rule and handle');
assert(!textOnly.includes('timeline-rule')&&!textOnly.includes('data-timeline-handle')&&!textOnly.includes('timeline-scrubber')&&textOnly.includes('<p>'),'Text-only timeline drops the graphic but keeps the items');
assert.equal(timelineMarkup(block,{graphic:false,text:false}),'','Both off emits no timeline markup');
const textHero=homeHero({heroContent:{timeline:false,timelineText:true,description:false}}),noTimelineHero=homeHero({heroContent:{timeline:false,timelineText:false,description:true}});
assert(textHero.includes('data-hero-timeline')&&!textHero.includes('data-timeline-handle'),'Text toggle alone renders the timeline without its graphic');
assert(!noTimelineHero.includes('data-hero-timeline')&&noTimelineHero.includes('data-hero-description'),'Both timeline toggles off leaves only the description');
assert(homeHero({heroContent:{timeline:true,description:false}}).includes('timeline-rule'),'Objects without timelineText follow the timeline toggle');
console.log('Hero timeline passed: structured items, safe rendering, cursor/drag modes, grab handle, bounds, keyboard isolation, native touch, reduced motion and cleanup.');
