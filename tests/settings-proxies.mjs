import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SETTING_PROXIES,proxyValue,mountSettingProxies} from '../dist/settings-proxies.js';

const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const styles=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');

function fakeInput(id,value){
 const listeners=[];
 return {id,type:typeof value==='boolean'?'checkbox':'select-one',checked:value===true,value:typeof value==='boolean'?'on':value,changes:0,
  onchange:null,dispatchEvent(event){this.changes++;this.onchange?.(event);for(const listener of listeners)listener(event);panelListeners.forEach(listener=>listener({...event,target:this}));},
  addEventListener(type,listener){if(type==='change')listeners.push(listener);}};
}
let panelListeners=[];
function fakePanel(values){
 panelListeners=[];
 const nodes=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,fakeInput(id,value)]));
 for(const proxy of SETTING_PROXIES)nodes[proxy.id]=fakeInput(proxy.id,'');
 return {nodes,querySelector:selector=>nodes[selector.slice(1)]??null,addEventListener:(type,listener)=>{if(type==='change')panelListeners.push(listener);}};
}
const defaults={cardShowClient:false,cardClientInline:false,cardClientAbove:false,cardShowTitle:true,cardShowCategory:true,cardShowDescription:true,cardCompanyYear:true,hideCardHover:true,cardHoverEffect:'glow',hideBranding:false,hideBrandAvatar:false,brandOneLine:true};

for(const proxy of SETTING_PROXIES){
 assert(html.includes(`id="${proxy.id}"`),`${proxy.id} menu is in the settings panel`);
 const select=html.slice(html.indexOf(`id="${proxy.id}"`),html.indexOf('</select>',html.indexOf(`id="${proxy.id}"`)));
 for(const option of Object.keys(proxy.options))assert(select.includes(`value="${option}"`),`${proxy.id} offers ${option}`);
 for(const id of new Set(Object.values(proxy.options).flatMap(Object.keys)))assert(new RegExp(`<label[^>]*setting-retired[^>]*>(<input|[^<]*<select) id="${id}"`).test(html),`#${id} stays in the panel, retired behind ${proxy.id}`);
}
assert(styles.includes('#settings .setting-retired{display:none}'),'Retired controls are hidden but stay in the panel for export');

// The owner's published combination reads back as one option per menu.
const panel=fakePanel(defaults);mountSettingProxies(panel);
assert.deepEqual(Object.fromEntries(SETTING_PROXIES.map(proxy=>[proxy.id,panel.nodes[proxy.id].value])),{cardClientProxy:'hidden',cardTitleProxy:'category',cardDescriptionProxy:'companyYear',cardHoverProxy:'off',brandProxy:'avatarLine'});

// Choosing an option sets only the switches that differ and fires their own change handlers.
panel.nodes.cardClientProxy.value='above';panel.nodes.cardClientProxy.dispatchEvent({type:'change'});
assert.equal(panel.nodes.cardClientAbove.checked,true);assert.equal(panel.nodes.cardClientAbove.changes,1);assert.equal(panel.nodes.cardShowClient.changes,1);assert.equal(panel.nodes.cardClientInline.changes,0);
panel.nodes.cardHoverProxy.value='tint';panel.nodes.cardHoverProxy.dispatchEvent({type:'change'});
assert.equal(panel.nodes.hideCardHover.checked,false);assert.equal(panel.nodes.cardHoverEffect.value,'tint');
assert.equal(panel.nodes.cardHoverProxy.value,'tint','The menu shows the state it wrote');

// A switch changed elsewhere (or an import) is reflected; a combination no option describes shows blank.
panel.nodes.brandOneLine.checked=false;panel.nodes.brandOneLine.dispatchEvent({type:'change'});
assert.equal(panel.nodes.brandProxy.value,'avatarStacked');
assert.equal(proxyValue(SETTING_PROXIES.find(proxy=>proxy.id==='cardClientProxy'),{cardShowClient:{type:'checkbox',checked:true},cardClientAbove:{type:'checkbox',checked:false},cardClientInline:{type:'checkbox',checked:true}}),'inline');
assert.throws(()=>mountSettingProxies({querySelector:()=>null,addEventListener(){}}),/menu #cardClientProxy is missing/);

// Mid-transition a choice writes no switch at all (never half an option), and the menu snaps back.
let allowed=false;const blocked=fakePanel(defaults);mountSettingProxies(blocked,{canChange:()=>allowed});
blocked.nodes.cardDescriptionProxy.value='hidden';blocked.nodes.cardDescriptionProxy.dispatchEvent({type:'change'});
assert.equal(blocked.nodes.cardShowDescription.changes+blocked.nodes.cardCompanyYear.changes,0);
assert.equal(blocked.nodes.cardDescriptionProxy.value,'companyYear');
allowed=true;blocked.nodes.cardDescriptionProxy.value='hidden';blocked.nodes.cardDescriptionProxy.dispatchEvent({type:'change'});
assert.equal(blocked.nodes.cardShowDescription.checked,false);

console.log('Settings proxies passed: merged menus read and write their retired switches, which stay exported.');
