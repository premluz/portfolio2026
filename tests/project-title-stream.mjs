import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDetailContentReveal} from '../dist/detail-content-reveal.js';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';
import {DEFAULT_TEXT_EFFECTS,headingRevealOptions} from '../dist/text-effects-settings.js';
import {revealDuration} from '../dist/text-stream-engine.js';

const read=name=>readFile(new URL(`../dist/${name}`,import.meta.url),'utf8');
const [app,html,transfer]=await Promise.all(['app.js','index.html','settings-transfer.js'].map(read));
assert(html.includes('<input id="projectTitleStream" type="checkbox">'),'The switch is in the Motion settings and starts unchecked');
assert(transfer.includes("projectTitleStream:'prem-project-title-stream'"),'The switch is exported and imported with the settings');
assert.equal(DEFAULT_STORAGE_VALUES['prem-project-title-stream'],'false','New behaviour starts off');
assert(app.includes("readFlag('prem-project-title-stream')")&&app.includes('titleStream:projectTitleStream'),'The reveal reads the persisted switch');

// A minimal DOM: requestAnimationFrame is driven by hand, so the engine's frames are deterministic.
let now=0,id=0;const frames=new Map();
globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
globalThis.cancelAnimationFrame=key=>frames.delete(key);
const tick=ms=>{now+=ms;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);};
const created=[];
globalThis.document={createElement:tag=>{const node={tag,className:'',children:[],textContent:'',setAttribute(){},append(...items){this.children.push(...items);}};created.push(node);return node;},createTextNode:text=>({textContent:text})};
const calls=[];
function element(text='',names=[]){
 const node={textContent:text,style:{opacity:''},classList:{contains:name=>names.includes(name),add(){},remove(){}},setAttribute(){},removeAttribute(){},append(){},
  animate(frames,options){const animation={frames,options,onfinish:null,cancelled:false,reversed:false,cancel(){this.cancelled=true;},reverse(){this.reversed=true;}};calls.push({node,animation});return animation;}};
 return node;
}
function page(){
 const title=element('Web3 film platform',['detail-caption-title']),intro=element('Intro',['detail-caption-intro']),fact=element('Fact');
 const caption={children:[title,intro]};
 const description={querySelectorAll:()=>[fact]};
 const detail={querySelector:selector=>selector===':scope > .detail-caption'?caption:selector==='.description'?description:null};
 const root={ownerDocument:{documentElement:{dataset:{cardText:'stagger'}}},matches:()=>false,querySelector:selector=>selector==='.detail:not(.info-detail)'?detail:null,querySelectorAll:()=>[]};
 return {title,intro,fact,root};
}
const timers=[];
globalThis.setTimeout=(fn,delay)=>{timers.push({fn,delay});return timers.length;};
globalThis.clearTimeout=handle=>{if(handle)timers[handle-1].fn=()=>{};};
const effects={...DEFAULT_TEXT_EFFECTS,effect:'classic'};
const reset=()=>{calls.length=0;timers.length=0;frames.clear();};

// Off: the title fades with the rest, as before.
reset();let p=page();createDetailContentReveal(p.root,{effects}).start();
assert.equal(calls.length,3,'With the switch off every caption line, the title included, fades');
assert(calls.some(({node})=>node===p.title));assert.equal(timers.length,0,'No stream is scheduled');

// On: the title leaves the fade and streams at its own slot (index 0, delay 0).
reset();p=page();let reveal=createDetailContentReveal(p.root,{effects,titleStream:true});
assert.equal(p.title.style.opacity,'0','The title is held until its slot');reveal.start();
assert(!calls.some(({node})=>node===p.title),'The title gets no fade animation');assert.equal(calls.length,2);
assert.deepEqual(calls.map(({animation})=>animation.options.delay),[44,88],'The other lines keep their own stagger slots');
assert.equal(timers.length,1);assert.equal(timers[0].delay,0,'Streaming starts at the title slot');
timers[0].fn();assert.equal(p.title.style.opacity,'','The title is visible once streaming starts');assert.equal(frames.size,1,'The edge stream is running');
tick(16);tick(16);assert(created.some(item=>item.className==='edge-stream-edge'),'The title streams behind the Heading reveal edge, whatever the assistant effect');
assert(p.title.textContent!=='Web3 film platform'||frames.size===0,'The title is mid-stream, not its plain text');

// Timed by Heading reveal, not by the assistant's rate: an 18-character title lands in about a third of a second.
{
 reset();const q=page(),landing=createDetailContentReveal(q.root,{effects,titleStream:true});landing.start();timers[0].fn();
 const start=now;let guard=0;while(frames.size&&guard++<200)tick(16);
 const expected=revealDuration(18,headingRevealOptions(effects).timing);
 assert(Math.abs(expected-340)<1,'The default timing is the thinkingisfree letter reveal');
 const timing=headingRevealOptions(effects).timing;
 assert(Math.abs(revealDuration(79,timing)-266.4)<.1&&Math.abs(revealDuration(300,timing)-240)<1e-9,'Same values as PremLab TextReveal: a long title lands sooner, and past 101 units the spread holds at its minimum');
 assert(now-start>=expected&&now-start<=expected+32,`Landed after ${now-start}ms, expected about ${Math.round(expected)}ms`);
 assert.equal(q.title.textContent,'Web3 film platform','It settles to the exact plain text');
 assert(html.includes('styled and timed by Heading reveal')&&html.includes('<summary>Heading reveal</summary>'),'The switch points to its own settings group');
 landing.cancel();
}

// Escape: the stream settles to the exact plain text, then the title fades out with the rest.
reveal.reverse();assert.equal(p.title.textContent,'Web3 film platform');assert.equal(frames.size,0,'No frame keeps running after reverse');
const fadeOut=calls.find(({node})=>node===p.title);assert.deepEqual(fadeOut.animation.frames,[{opacity:1},{opacity:0}],'The streamed title fades out');
reveal.cancel();assert.equal(p.title.textContent,'Web3 film platform');

// Reversed before its slot: nothing streams and the title stays hidden.
reset();p=page();reveal=createDetailContentReveal(p.root,{effects,titleStream:true});reveal.start();reveal.reverse();
timers[0]?.fn();assert.equal(frames.size,0,'A reversed page never starts the stream');assert(!calls.some(({node})=>node===p.title));

// Pausing settles a running stream; cancelling leaves the plain text.
reset();p=page();reveal=createDetailContentReveal(p.root,{effects,titleStream:true});reveal.start();timers[0].fn();reveal.pause();
assert.equal(p.title.textContent,'Web3 film platform','Pause settles the stream, which cannot itself pause');assert.equal(frames.size,0);reveal.cancel();

// Reduced motion keeps today's behaviour: nothing is hidden, nothing streams.
reset();p=page();reveal=createDetailContentReveal(p.root,{effects,titleStream:true,reduced:true});reveal.start();
assert.equal(p.title.style.opacity,'');assert.equal(calls.length,0);assert.equal(timers.length,0);
console.log('Project title stream passed: switch, export, fade fallback, stream slot, Escape, pause and reduced motion.');
