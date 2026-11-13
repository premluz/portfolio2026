import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATCH_UP,GLYPH_SETS,advance,graphemes,scrambleGlyph,scrambleUnit,split,tokenize} from '../dist/text-stream-engine.js';
import {streamEdgeText} from '../dist/text-stream-edge.js';
import {streamText} from '../dist/assistant-text-stream.js';
import {DEFAULT_TEXT_EFFECTS,TEXT_EFFECTS_KEY,TEXT_EFFECT_COLORS,TEXT_EFFECT_CONTROLS,glimmerOptions,mountTextEffectSettings,normalizeTextEffects,readTextEffects} from '../dist/text-effects-settings.js';
import {applyGlimmer,glimmerGradient} from '../dist/text-glimmer.js';
import {mountThinkingIndicator} from '../dist/iconiq-chat-effects.js';
import {clientStyles} from '../scripts/client-styles.mjs';

const read=name=>fs.readFileSync(new URL(`../dist/${name}`,import.meta.url),'utf8');

// Engine ------------------------------------------------------------------------------------------------------
assert.deepEqual(tokenize('Hello, world','word'),['Hello, ','world']);
assert.deepEqual(tokenize('  hi there','word'),['  ','hi ','there'],'Leading whitespace is its own token');
const exact='  Line one.\n\nLine two — <safe> & 😀 ';
for(const unit of ['character','word'])assert.equal(tokenize(exact,unit).join(''),exact,`${unit} tokens join back to the exact text`);
assert.equal(graphemes('a😀👨‍👩‍👧é').length,4,'An emoji sequence is one unit');
assert.throws(()=>tokenize('x','line'),/Unknown stream unit "line"/);

const pace={rate:45,catchUp:false};
assert.equal(advance({shown:0,credit:0},100,1000,pace).shown,45);
let walk={shown:0,credit:0};for(let i=0;i<100;i++)walk=advance(walk,1000,10,pace);
assert(Math.abs(walk.shown-45)<=1,'Pace does not depend on the frame rate');
assert.equal(advance({shown:0,credit:0},100,100,{rate:1,catchUp:false}).shown,0);
assert.equal(advance({shown:0,credit:0},100,100,{rate:1,catchUp:true}).shown,Math.floor(CATCH_UP.maxRate*.1),'A long backlog speeds the edge up to the ceiling');
assert.deepEqual(advance({shown:99,credit:.5},100,1000,pace),{shown:100,credit:0},'The edge stops at the end and forgets spare credit');

const letters='abcdefghij'.split('');
assert.deepEqual(split(letters,5,3),{settled:'ab',edgeStart:2,edge:['c','d','e'],pending:'fghij'});
assert.deepEqual(split(letters,12,3),{settled:'abcdefghi',edgeStart:9,edge:['j'],pending:''},'Past the end, the edge drains');
assert.deepEqual(split(letters,0,3),{settled:'',edgeStart:0,edge:[],pending:'abcdefghij'},'Before the start, everything is laid out but pending');

assert.equal(scrambleGlyph(' ',3,9,'code'),' ','Whitespace is never scrambled');
assert.equal(scrambleGlyph('a',3,9,'code'),scrambleGlyph('a',3,9,'code'),'Scrambling is repeatable');
assert([...Array(12).keys()].some(tick=>scrambleGlyph('a',3,tick,'code')!==scrambleGlyph('a',3,0,'code')),'Stand-ins change with the tick');
for(const [name,set] of Object.entries(GLYPH_SETS))assert([...Array(30).keys()].every(tick=>set.includes(scrambleGlyph('x',tick,tick,name))),`${name} stand-ins come from their own set`);
const word=scrambleUnit('hi ',4,2,'letters');assert.equal(word.length,3);assert.equal(word.at(-1),' ','A word keeps its trailing space');
assert.throws(()=>scrambleGlyph('a',0,0,'runes'),/Unknown glyph set "runes"/);

// Edge renderer ------------------------------------------------------------------------------------------------
let now=0,frameId=0;const frames=new Map();
globalThis.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
function el(){
 const node={children:[],attributes:{},classes:new Set(),own:'',className:'',style:{props:{},setProperty(key,value){this.props[key]=value;}},
  get textContent(){return this.own+this.children.map(child=>child.textContent).join('');},
  set textContent(value){this.own=String(value);this.children=[];},
  classList:{add:name=>node.classes.add(name),remove:name=>node.classes.delete(name),toggle:(name,on)=>on?node.classes.add(name):node.classes.delete(name)},
  setAttribute(key,value){this.attributes[key]=String(value);},removeAttribute(key){delete this.attributes[key];},
  append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;this.own='';}};
 return node;
}
globalThis.document={createElement:el,createTextNode:text=>({textContent:text,children:[]})};
const tick=ms=>{now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));};
const style=(over={})=>({...DEFAULT_TEXT_EFFECTS,effect:'feather',edge:4,speed:60,catchUp:false,...over});
const text='Hello streaming world, again.';
const visualOf=p=>p.children[1];

function run(over,{limit=400}={}){
 const p=el();let completed=0;const seen=[];
 const finish=streamEdgeText(p,text,{style:style(over),onComplete:()=>completed++});
 for(let i=0;i<limit&&frames.size;i++){tick(16.667);if(p.attributes['aria-busy']==='true')seen.push({visual:visualOf(p).textContent,edge:visualOf(p).children[1].textContent,settled:visualOf(p).children[0].textContent});}
 return {p,finish,completed,seen};
}

{const p=el();p.setAttribute('aria-label','x');streamEdgeText(p,text,{style:style()});
 assert.equal(p.children[0].textContent,text,'Screen readers receive the whole text once');assert.equal(p.children[0].className,'sr');
 assert.equal(visualOf(p).attributes['aria-hidden'],'true','The animated copy is hidden from them');
 assert.equal(p.attributes['aria-busy'],'true');assert(!('aria-label' in p.attributes),'The answer is read from the hidden copy, not its label');
 assert(p.classes.has('edge-stream'));assert.equal(p.attributes['data-effect'],'feather');assert.equal(p.attributes['data-tint'],'single');assert.equal(p.attributes['data-color'],'blue');
 frames.clear();}

{const {p,completed,seen}=run({});
 assert(seen.length>5,'It streams over several frames');
 assert(seen.every(frame=>frame.visual===text),'Every frame holds the whole text, so nothing reflows');
 assert(seen.every(frame=>[...frame.edge].length<=4),'The edge never exceeds its length');
 assert(seen.some((frame,i)=>i&&frame.settled.length>seen[i-1].settled.length),'Settled text grows');
 assert.equal(p.textContent,text,'Settling leaves the exact text');assert.equal(p.children.length,0,'…as one plain text node');
 assert.equal(p.attributes['aria-busy'],'false');assert(!p.classes.has('edge-stream'));assert.deepEqual(Object.keys(p.attributes),['aria-busy'],'The state attributes are removed');
 assert.equal(completed,1);assert.equal(frames.size,0,'No frame is left running');}

{const {seen}=run({effect:'scramble'});
 assert(seen.every(frame=>frame.visual.length===text.length),'Scrambling swaps glyphs without changing the length');
 assert(seen.some(frame=>frame.edge&&!text.includes(frame.edge)),'The edge shows stand-in glyphs');
 assert(seen.every(frame=>[...frame.visual].every((char,i)=>text[i]===' '?char===' ':true)),'Spaces stay put');}

{const {seen}=run({unit:'word',edge:2});
 assert(seen.every(frame=>frame.visual===text));
 assert(seen.every(frame=>frame.settled===''||/\s$/.test(frame.settled)),'Words settle whole, with their trailing space');}

{const p=el();streamEdgeText(p,text,{style:style({caret:true})});assert(visualOf(p).children.some(child=>child.className==='edge-stream-caret'),'The caret sits at the edge');frames.clear();
 const none=el();streamEdgeText(none,text,{style:style()});assert(!visualOf(none).children.some(child=>child.className==='edge-stream-caret'),'No caret by default');frames.clear();}

{const p=el();let completed=0;const finish=streamEdgeText(p,exact,{style:style(),onComplete:()=>completed++});tick(16.667);
 finish();assert.equal(p.textContent,exact,'Cancelling keeps every character');finish();assert.equal(completed,1,'Cancelling twice completes once');assert.equal(frames.size,0);}

{const p=el();let completed=0;streamEdgeText(p,text,{reduced:true,style:style(),onComplete:()=>completed++});
 assert.equal(p.textContent,text);assert.equal(p.children.length,0);assert.equal(frames.size,0,'Reduced motion shows the text at once');assert.equal(completed,1);}
{const p=el();streamEdgeText(p,'',{style:style()});assert.equal(frames.size,0,'Empty text needs no animation');}

{const p=el();streamText(p,text,{effects:style()});assert(p.classes.has('edge-stream'),'The assistant stream follows the Effect setting');frames.clear();
 const classic=el();streamText(classic,text,{effects:DEFAULT_TEXT_EFFECTS});assert(!classic.classes.has('edge-stream'),'Classic keeps the original per-character fade');assert(classic.classes.has('vivid-stream'));frames.clear();}

// Settings ----------------------------------------------------------------------------------------------------
assert.deepEqual(normalizeTextEffects(undefined),DEFAULT_TEXT_EFFECTS);
const bad=normalizeTextEffects({effect:'sparkle',speed:9999,edge:0,swap:NaN,catchUp:'yes',glimmerSpeed:-3,glimmerDirection:'up',color:'mauve'});
assert.deepEqual([bad.effect,bad.speed,bad.edge,bad.swap,bad.catchUp,bad.glimmerSpeed,bad.glimmerDirection,bad.color],['classic',220,1,70,true,.4,'ltr','blue'],'Unknown or out-of-range values fall back or clamp');
assert.equal(DEFAULT_TEXT_EFFECTS.effect,'classic','The live site is unchanged until an effect is chosen (ADR-005)');assert.equal(DEFAULT_TEXT_EFFECTS.glimmer,false);
{const warn=console.warn;const warnings=[];console.warn=(...args)=>warnings.push(args);
 assert.deepEqual(readTextEffects({getItem(){throw new Error('denied');}}),DEFAULT_TEXT_EFFECTS);assert.equal(warnings.length,1,'Unreadable storage is reported, not hidden');
 assert.deepEqual(readTextEffects({getItem:()=>'{broken'}),DEFAULT_TEXT_EFFECTS);console.warn=warn;}
{const stored=new Map();const storage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
 const inputs=Object.fromEntries(Object.entries(TEXT_EFFECT_CONTROLS).map(([key,control])=>[key,{control,value:'',checked:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}}]));
 const outputs=Object.fromEntries(Object.keys(inputs).map(key=>[key,{value:''}]));
 const panel={querySelector(selector){const [,kind,key]=selector.match(/data-text-effect-(control|output)="(\w+)"/);return (kind==='control'?inputs:outputs)[key];}};
 let changes=0;const mounted=mountTextEffectSettings(panel,{storage,onChange:()=>changes++});
 assert.equal(inputs.speed.value,'45');assert.equal(outputs.swap.value,'70ms');assert.equal(inputs.catchUp.checked,true);
 inputs.effect.value='scramble';inputs.effect.listeners.change();inputs.speed.value='120';inputs.speed.listeners.input();inputs.caret.checked=true;inputs.caret.listeners.change();
 const saved=JSON.parse(stored.get(TEXT_EFFECTS_KEY));assert.deepEqual([saved.effect,saved.speed,saved.caret],['scramble',120,true],'Choices are saved');assert.equal(changes,3);
 assert.equal(readTextEffects(storage).effect,'scramble','…and read back');assert.equal(outputs.speed.value,'120');assert.equal(mounted.value.edge,8);
 inputs.speed.value='5000';inputs.speed.listeners.input();assert.equal(JSON.parse(stored.get(TEXT_EFFECTS_KEY)).speed,220,'An out-of-range value is clamped before it is saved');
 assert.throws(()=>mountTextEffectSettings({querySelector:()=>null},{storage}),/Text effect control "effect" is missing/,'A missing control fails loudly');}

// Panel markup matches the control table (drift guard) ----------------------------------------------------------
{const html=read('index.html');
 for(const [key,control] of Object.entries(TEXT_EFFECT_CONTROLS)){
  const tag=html.match(new RegExp(`<(select|input)[^>]*data-text-effect-control="${key}"[^>]*>`));assert(tag,`${key} has a control in the panel`);
  if(control.type==='choice'){const block=html.slice(html.indexOf(tag[0]),html.indexOf('</select>',html.indexOf(tag[0])));assert.deepEqual([...block.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]),[...control.options],`${key} offers exactly its options`);}
  if(control.type==='range'){assert(tag[0].includes(`min="${control.min}"`)&&tag[0].includes(`max="${control.max}"`),`${key} range matches`);assert(tag[0].includes(`value="${control.value}"`),`${key} starts at its default`);}
  if(control.type==='toggle')assert(tag[0].includes('type="checkbox"'),`${key} is a checkbox`);assert.equal(tag[0].includes(' checked'),control.type==='toggle'&&control.value,`${key} starts as its default`);
 }}

// Glimmer ----------------------------------------------------------------------------------------------------
{const single=glimmerGradient('single','teal',30);
 assert(single.includes('0%')&&single.includes(' 35%')&&single.includes(' 65%'),'The band fills the spread around the middle');
 assert(single.includes('var(--text-glimmer-color, var(--text-effect-teal)) 50%'));
 const multi=glimmerGradient('multi','blue',30);for(const stop of [41,47,53,59])assert(multi.includes(` ${stop}%`),`prism stop at ${stop}%`);assert(multi.includes('--text-effect-prism-4'));
 assert(glimmerGradient('none','blue',30).includes('var(--text-glimmer-peak, var(--ink)) 50%'));
 assert(single.indexOf('35%')<single.indexOf('50%')&&single.indexOf('50%')<single.indexOf('65%'),'Resting ink on both sides of the peak');
 const label=el();applyGlimmer(label,{tint:'single',color:'blue',speed:2.4,spread:20,direction:'rtl'});
 assert.equal(label.attributes['data-direction'],'rtl');assert('data-glimmer' in label.attributes);assert.equal(label.style.props['--text-glimmer-cycle'],'2.4s');assert(label.style.props['--text-glimmer-gradient'].startsWith('linear-gradient(90deg'));}
{const on={...DEFAULT_TEXT_EFFECTS,glimmer:true,glimmerSpeed:2};
 const status=el();mountThinkingIndicator(status,{effects:on});assert('data-glimmer' in status.attributes,'The Thinking label glimmers when switched on');assert.equal(status.style.props['--text-glimmer-cycle'],'2s');
 const off=el();mountThinkingIndicator(off,{effects:DEFAULT_TEXT_EFFECTS});assert(!('data-glimmer' in off.attributes),'Off by default: the classic shimmer');
 const still=el();mountThinkingIndicator(still,{reduced:true,effects:on});assert(!('data-glimmer' in still.attributes),'No glimmer under reduced motion');
 assert.deepEqual(glimmerOptions(on),{enabled:true,tint:'single',color:'blue',speed:2,spread:30,direction:'ltr'});}

// Styles ------------------------------------------------------------------------------------------------------
{const tokens=read('tokens.css'),css=read('text-effects.css');
 for(const color of TEXT_EFFECT_COLORS){
  assert.equal(tokens.match(new RegExp(`--text-effect-${color}:`,'g')).length,2,`${color} has a light and a dark tint`);
  assert(css.includes(`.edge-stream[data-color="${color}"]{--edge-stream-color:var(--text-effect-${color})}`),`${color} edge rule`);
 }
 for(const index of [1,2,3,4])assert(tokens.includes(`--text-effect-prism-${index}:`));
 assert(tokens.includes('--duration-text-caret:'));
 assert(css.includes('@keyframes text-glimmer-ltr')&&css.includes('@keyframes text-glimmer-rtl')&&css.includes('@keyframes edge-stream-blink'));
 assert(css.includes(':root[data-animation="off"] .iconiq-thinking[data-glimmer]')&&css.includes('prefers-reduced-motion:reduce){:root .iconiq-thinking[data-glimmer]'),'Glimmer rests under Animation off and reduced motion');
 assert(css.includes(':root[data-animation="off"] .edge-stream-caret{animation:none}'));
 assert(clientStyles.indexOf('text-effects.css')>clientStyles.indexOf('iconiq-chat-effects.css'),'It loads after the classic label rules it overrides');}
console.log('Text effects passed: engine pacing and edges, feather and scramble renderers, exact settled text, settings validation, panel drift guard, glimmer maths, thinking label and styles.');
