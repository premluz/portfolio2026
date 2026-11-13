import {LiquidPopover} from './liquid-popover.js';
// Classic-nav Settings: a gear after Contact opens a dock popover with Theme, Text size, Sound and Animation.
// Theme buttons are plain [data-theme-choice] (environment.js owns them); Sound and Animation forward to the
// composer menu's switches so each preference keeps one owner.
export const READER_TEXT_KEY='prem-reader-text-size';
export const NAV_SETTINGS_KEY='prem-nav-show-settings';
export const READER_TEXT_SIZES=Object.freeze(['small','medium','large']);
const POPOVER_WIDTH=330;
export const normalizeReaderTextSize=value=>READER_TEXT_SIZES.includes(value)?value:'medium';

function readPreference(storage,key){
 try{return storage?.getItem(key)??null;}catch(error){console.warn(`Preference ${key} unreadable; using its default`,error);return null;}
}
function writePreference(storage,key,value){
 try{storage?.setItem(key,value);}catch(error){console.warn(`Preference ${key} not saved`,error);}
}

export function applyReaderTextSize(root,value){
 const size=normalizeReaderTextSize(value);root.dataset.readerTextSize=size;
 for(const button of root.querySelectorAll('[data-text-size-choice]')){const active=button.dataset.textSizeChoice===size;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
 return size;
}

// Applied on import, before the first render, so body text never jumps size after load.
if(typeof document!=='undefined')applyReaderTextSize(document.documentElement,readPreference(globalThis.localStorage,READER_TEXT_KEY));

function mirrorSwitch(control,root){
 const source=root.getElementById(control.dataset.preferenceMirror);
 if(!source)throw new Error(`Settings popover: switch #${control.dataset.preferenceMirror} is missing, so "${control.getAttribute('aria-labelledby')}" cannot follow it`);
 const sync=()=>control.setAttribute('aria-checked',source.getAttribute('aria-checked')==='true'?'true':'false');
 new MutationObserver(sync).observe(source,{attributes:true,attributeFilter:['aria-checked']});
 // The composer menu disables a switch whose icon it hides (menu-icon-settings.js), and a disabled button ignores
 // click(); calling its handler keeps Settings working whatever that menu shows.
 control.onclick=()=>{
  if(typeof source.onclick!=='function')throw new Error(`Settings popover: #${source.id} has no click handler to forward to`);
  source.onclick(new MouseEvent('click'));
 };
 sync();
}

export function mountSitePreferences({dock,toggle,menu,flagInput,below,reduced,duration,onOpen=()=>{},onNavChange=()=>{},storage=globalThis.localStorage,root=document}){
 const html=root.documentElement;
 for(const button of menu.querySelectorAll('[data-text-size-choice]'))button.onclick=()=>writePreference(storage,READER_TEXT_KEY,applyReaderTextSize(html,button.dataset.textSizeChoice));
 applyReaderTextSize(html,html.dataset.readerTextSize);
 for(const control of menu.querySelectorAll('[data-preference-mirror]'))mirrorSwitch(control,root);
 const popover=new LiquidPopover(dock,menu,toggle,{reduced,duration,anchor:'main-start',width:POPOVER_WIDTH,below,onOpen,returnFocus:()=>toggle});
 const showGear=shown=>{toggle.hidden=!shown;flagInput.checked=shown;if(!shown&&popover.active)popover.setOpen(false,{immediate:true,restoreFocus:false});onNavChange();};
 flagInput.onchange=()=>{writePreference(storage,NAV_SETTINGS_KEY,String(flagInput.checked));showGear(flagInput.checked);};
 showGear(readPreference(storage,NAV_SETTINGS_KEY)==='true');
 return {popover,close:()=>{if(popover.active)popover.setOpen(false,{immediate:true,restoreFocus:false});}};
}
