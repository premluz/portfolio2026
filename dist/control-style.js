import {CONTROL_STYLES,CONTROL_GROUPS,CONTROL_STYLE_KEY,controlGroupKey,controlGroupInput,readControlPreferences,resolveControlStyle} from './control-preferences.js';

const targets=[
 {group:'navigation',role:'container',selector:'#dock,.assistant-inline-composer'},
 {group:'projects',role:'surface',selector:'.header-detail-nav button,.detail-media-actions button,.project-media-focus-close'},
 {group:'suggestions',role:'surface',selector:'.ask-suggestions button'},
 {group:'carousels',role:'surface',selector:'.spatial-gallery-controls button,.card-rail-controls button,.hero-carousel-controls button'},
 {group:'navigation',role:'surface',selector:'#dock>.assistant-launcher,#dock .assistant-back'},
 {group:'navigation',role:'item',selector:'#dock nav :is(a,button),#dock .context-nav button,#dock .site-settings-toggle,#dock .project-menu button,:is(#dock,.assistant-inline-composer) .assistant-composer button,#dock .voice-composer button,#dock .composer-context-actions :is(button,a)'},
 {group:'utilities',role:'surface',selector:'.glass-utility-button,.corner-controls button,#askToggle,header .theme-toggle,header #settingsToggle,.footer-links :is(a,button),.assistant-floating-bar button'}
];
const selector=targets.map(target=>target.selector).join(',');
const classes=CONTROL_STYLES.map(style=>'control-'+style);

function localStyle(node,root){
 for(let current=node;current&&current!==root;current=current.parentElement){
  const style=current.dataset.controlStyle;
  if(style===undefined||style==='inherit')continue;
  if(!CONTROL_STYLES.includes(style))throw Error(`Invalid local control style on ${current.tagName}: ${style}`);
  return style;
 }
 return 'inherit';
}
export function applyControlStyles(scope,preferences,root=scope.ownerDocument.documentElement){
 const nodes=[...(scope.matches?.(selector)?[scope]:[]),...scope.querySelectorAll(selector)];
 for(const node of nodes){
  const target=targets.find(item=>node.matches(item.selector));
  const style=resolveControlStyle(preferences.style,preferences.groups[target.group],localStyle(node,root));
  for(const name of classes)node.classList.toggle(name,name==='control-'+style);
  for(const role of ['surface','container','item'])node.classList.toggle('control-'+role,role===target.role);
 }
}
export function mountControlStyles(panel,{root=document.documentElement,storage=globalThis.localStorage}={}){
 const preferences=readControlPreferences(storage),input=panel.querySelector('#controlStyle');
 const refresh=()=>{root.dataset.controlStyle=preferences.style;applyControlStyles(root,preferences,root);};
 const save=(key,value)=>{
  try{storage?.setItem(key,value);}
  catch(error){console.warn(`Control style could not be saved: ${key}.`,error);}
  refresh();
 };
 input.value=preferences.style;
 input.onchange=()=>{preferences.style=input.value;save(CONTROL_STYLE_KEY,input.value);};
 for(const group of CONTROL_GROUPS){
  const local=panel.querySelector('#'+controlGroupInput(group));
  local.value=preferences.groups[group];
  local.onchange=()=>{preferences.groups[group]=local.value;save(controlGroupKey(group),local.value);};
 }
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes')applyControlStyles(record.target,preferences,root);
   else for(const node of record.addedNodes)if(node.nodeType===Node.ELEMENT_NODE)applyControlStyles(node,preferences,root);
  }
 });
 refresh();
 observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-control-style']});
 return {refresh,destroy:()=>observer.disconnect()};
}
