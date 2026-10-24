import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readAssistantPresentation,mountAssistantPresentation,setAssistantFloating} from '../dist/assistant-floating.js';

const memory=(initial={})=>{const values={...initial};return {values,getItem:key=>key in values?values[key]:null,setItem:(key,value)=>{values[key]=value;}};};
assert.equal(readAssistantPresentation(memory()),'page','The chat page stays the default');
assert.equal(readAssistantPresentation(memory({'prem-assistant-presentation':'floating'})),'floating');
assert.equal(readAssistantPresentation(memory({'prem-assistant-presentation':'sideways'})),'page','Unknown values fall back to the page');
{const warn=console.warn;console.warn=()=>{};assert.equal(readAssistantPresentation({getItem:()=>{throw new Error('blocked');}}),'page');console.warn=warn;}
const storage=memory(),select={value:''},changes=[];const state=mountAssistantPresentation(select,{storage,onChange:value=>changes.push(value)});
assert.equal(select.value,'page');select.value='floating';select.onchange();assert.equal(state.value,'floating');assert.equal(storage.values['prem-assistant-presentation'],'floating');assert.deepEqual(changes,['floating']);

const classes=new Set(),bar={hidden:true},attributes=new Map();
const page={classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},dataset:{},querySelector:()=>bar,setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
setAssistantFloating(page,true);assert(classes.has('assistant-floating')&&page.dataset.floating==='true'&&!bar.hidden,'Opening shows the panel and its maximise and close bar');
setAssistantFloating(page,false);assert(!classes.has('assistant-floating')&&page.dataset.floating===undefined&&bar.hidden,'Closing returns the page to normal');

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),view=await readFile(new URL('../dist/assistant-view.js',import.meta.url),'utf8');
assert(html.includes('id="assistantLauncher"')&&html.includes('class="assistant-launcher-label">Assistant<'),'The dock has an Assistant button with a chat icon');
const navHtml=html.slice(html.indexOf('<nav aria-label="Main navigation">'),html.indexOf('</form></nav>')+13);assert(!navHtml.includes('assistantLauncher'),'The button is its own pill beside the dock, not an item of the menu');
const morph=await readFile(new URL('../dist/dock-morph.js',import.meta.url),'utf8');assert(morph.includes("launcher&&!launcher.hidden?launcher.offsetWidth+this.baseMetrics.gap:0"),'The dock centres itself together with the button');
assert(html.includes('id="assistantMaximize"')&&html.includes('id="assistantFloatingClose"')&&html.includes('id="assistantPresentation"'));
assert(app.includes("const composerShown=route=>route==='assistant'||contextualComposer||contextualButtons==='composer'||assistantFloating;"),'One rule decides when the dock shows the composer, including the open panel');
assert(!/current==='assistant'\|\|contextualComposer\|\|contextualButtons==='composer'/.test(app),'No copies of the old rule remain');
assert(app.includes("const shown=!contextualComposer&&contextualButtons!=='composer';"),'The button appears only when the menu fills the dock');
assert(app.includes('if(assistantFloating)closeAssistantFloating({focus:false});')&&app.includes("if(assistantFloating){closeAssistantFloating();return {ok:true,message:'Assistant closed'};}"),'Navigation and Escape close the panel');
assert(app.includes("closeAssistantFloating({focus:false});dispatchCommand({id:'route.assistant',source:'pointer'});"),'Maximise moves the conversation to the chat page');
assert(view.includes("if(r.page.dataset.floating==='true'){r.page.scrollTo("),'The panel scrolls itself, never the page behind it');
const transfer=await readFile(new URL('../dist/settings-transfer.js',import.meta.url),'utf8');assert(transfer.includes("assistantPresentation:'prem-assistant-presentation'"),'The setting exports and publishes');
console.log('Assistant floating passed: page default, presentation setting, panel state, launcher rule, one composer rule, navigation/Escape close, maximise and panel scrolling.');
