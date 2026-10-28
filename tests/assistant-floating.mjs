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
assert.equal(readAssistantPresentation(memory({'prem-assistant-presentation':'sidebar'})),'sidebar','Sidebar is a saved presentation');
setAssistantFloating(page,true,'sidebar');assert(classes.has('assistant-floating')&&classes.has('assistant-sidebar'),'The sidebar variant is the floating conversation docked right');
setAssistantFloating(page,false,'sidebar');assert(!classes.has('assistant-sidebar')&&!classes.has('assistant-floating'),'Closing removes the sidebar');
for(const file of ['dist/index.html'])assert((await readFile(new URL('../'+file,import.meta.url),'utf8')).includes('<option value="sidebar">Sidebar</option>'),file+' offers the Sidebar presentation');
const dockMorphSource=await readFile(new URL('../dist/dock-morph.js',import.meta.url),'utf8');
assert(dockMorphSource.includes("getPropertyValue('--composer-max-width')"),'The dock takes its composer width cap from the token, so the sidebar can narrow it');

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),view=await readFile(new URL('../dist/assistant-view.js',import.meta.url),'utf8');
assert(html.includes('id="assistantLauncher"')&&html.includes('class="assistant-launcher-label">Assistant<'),'The dock has an Assistant button with a chat icon');
const navHtml=html.slice(html.indexOf('<nav aria-label="Main navigation">'),html.indexOf('</form></nav>')+13);assert(!navHtml.includes('assistantLauncher'),'The button is its own pill beside the dock, not an item of the menu');
const morph=await readFile(new URL('../dist/dock-morph.js',import.meta.url),'utf8');assert(morph.includes("launcher&&!launcher.hidden?launcher.offsetWidth+this.baseMetrics.gap:0"),'The dock centres itself together with the button');
assert(html.includes('id="assistantMaximize"')&&html.includes('id="assistantFloatingClose"')&&html.includes('id="assistantPresentation"'));
assert(app.includes("const composerShown=route=>route==='assistant'&&!inlineChat(route)||contextualComposer||assistantFloating;"),'One rule decides when the dock shows the composer, including the open panel');
assert(app.includes("const inlineChat=route=>route==='assistant'&&chatInlineComposer&&!contextualComposer;"),'In menu-dock mode the chat page keeps the menu and puts the composer in the page');
assert(html.includes('<p>I’m Prem’s custom-built assistant.</p>')&&!html.includes('powered by ChatGPT'),'The welcome text is just the one line');
assert(html.includes('<div class="assistant-inline-composer" id="assistantInlineComposer" hidden></div>')&&html.includes('<div class="assistant-mascot" id="assistantMascot" aria-hidden="true" hidden></div>'),'The chat page has a composer slot and a mascot stage');
assert(!/current==='assistant'\|\|contextualComposer\|\|contextualButtons==='composer'/.test(app),'No copies of the old rule remain');
assert(app.includes("const available=!contextualComposer,character=available&&characterAssistant&&showMascot&&Boolean(characterButton),shown=available&&!character,item=$('#assistantNavItem');"),'The Assistant item shows only when the menu fills the dock, unless the visible mascot stands in for it');
assert(app.includes("projectMenuToggle.hidden=character;"),'The index button steps aside while the character is the assistant');
assert(app.includes("if(characterButton.classList.contains('agent-assistant'))assistantLauncher.onclick();"),'Clicking the character opens the assistant the same way as the button');
assert(app.includes('if(assistantFloating)closeAssistantFloating({focus:false});')&&app.includes("if(assistantFloating){closeAssistantFloating();return {ok:true,message:'Assistant closed'};}"),'Navigation and Escape close the panel');
assert(app.includes("closeAssistantFloating({focus:false});dispatchCommand({id:'route.assistant',source:'pointer'});"),'Maximise moves the conversation to the chat page');
assert(view.includes("if(r.page.dataset.floating==='true'){r.page.scrollTo("),'The panel scrolls itself, never the page behind it');
const transfer=await readFile(new URL('../dist/settings-transfer.js',import.meta.url),'utf8');assert(transfer.includes("assistantPresentation:'prem-assistant-presentation'"),'The setting exports and publishes');
{const chatCss=await readFile(new URL('../dist/portfolio-assistant.css',import.meta.url),'utf8');
assert(chatCss.includes('.assistant-welcome :is(h1,p){max-width:min(100%,calc(var(--content-rail-width) / 2))}')&&chatCss.includes('.assistant-welcome h1{color:var(--ink)}'),'The chat welcome is a half-width block with its title in full ink');
assert(chatCss.includes(':root:not(.assistant-inline-open) #askPage.assistant-page{--chat-top:var(--page-content-top)}'),'Without the mascot stage the welcome starts where page titles start');}
{const hp=html,tr2=await readFile(new URL('../dist/settings-transfer.js',import.meta.url),'utf8'),df=await readFile(new URL('../dist/default-settings.js',import.meta.url),'utf8'),ds=await readFile(new URL('../dist/design-system.css',import.meta.url),'utf8'),ag=await readFile(new URL('../dist/agent.css',import.meta.url),'utf8');
assert(hp.includes('<a href="#assistant" data-nav="assistant" id="assistantNavItem" class="assistant-nav-item" hidden>Assistant</a>'),'The dock menu has an Assistant item after Contact');
assert(hp.indexOf('data-nav="contact"',hp.indexOf('id="dock"'))<hp.indexOf('id="assistantNavItem"')&&hp.indexOf('id="assistantNavItem"')<hp.indexOf('id="projectMenuToggle"'),'It sits at the end of the menu, after Contact');
for(const id of ['navShowLab','navShowContact','navChatLabel','characterAssistant','showMascot'])assert(hp.includes(`id="${id}"`),`The Navigation settings have ${id}`);
assert(hp.includes('<option value="Assistant" selected>Assistant</option><option value="Call Assistant">Call Assistant</option><option value="Ask Assistant">Ask Assistant</option>'),'The chat item reads Assistant, Call Assistant or Ask Assistant');
assert(tr2.includes("navShowLab:'prem-nav-show-lab'")&&tr2.includes("showMascot:'prem-show-mascot'")&&df.includes("'prem-nav-show-lab':'true'")&&df.includes("'prem-show-mascot':'true'"),'Menu item choices are exported and start on');
assert(app.includes("if(link.dataset.nav==='assistant'){assistantLauncher.onclick();return;}")&&app.includes("assistantLauncher.hidden=true;item.hidden=!shown;"),'The item opens the assistant the way the old button did, and the old pill stays hidden');
assert(ds.includes('#dock nav a[hidden]{display:none}')&&ag.includes(':root.mascot-hidden .agent{display:none}'),'Hidden items and a hidden mascot take no room');}
console.log('Assistant floating passed: page default, presentation setting, panel state, launcher rule, one composer rule, navigation/Escape close, maximise and panel scrolling.');
