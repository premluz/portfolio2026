// One menu stands in for several retired switches that together set one thing. The switches stay in the
// panel (hidden), so storage, export, import and publishing are unchanged; a menu only reads them and,
// when chosen, sets them and fires their own change handlers.

const read=(input)=>input.type==='checkbox'?input.checked:input.value;

// Each option maps to the values its switches must hold. The first option whose values all match is shown.
export const SETTING_PROXIES=[
 {id:'cardClientProxy',options:{hidden:{cardShowClient:false},above:{cardShowClient:true,cardClientAbove:true},inline:{cardShowClient:true,cardClientAbove:false,cardClientInline:true},line:{cardShowClient:true,cardClientAbove:false,cardClientInline:false}}},
 {id:'cardTitleProxy',options:{category:{cardShowTitle:true,cardShowCategory:true},title:{cardShowTitle:true,cardShowCategory:false},hidden:{cardShowTitle:false}}},
 {id:'cardDescriptionProxy',options:{companyYear:{cardShowDescription:true,cardCompanyYear:true},description:{cardShowDescription:true,cardCompanyYear:false},hidden:{cardShowDescription:false}}},
 {id:'cardHoverProxy',options:{off:{hideCardHover:true},reveal:{hideCardHover:false,cardHoverEffect:'reveal'},'reveal-soft':{hideCardHover:false,cardHoverEffect:'reveal-soft'},tint:{hideCardHover:false,cardHoverEffect:'tint'},glow:{hideCardHover:false,cardHoverEffect:'glow'}}},
 {id:'brandProxy',options:{hidden:{hideBranding:true},stacked:{hideBranding:false,hideBrandAvatar:true,brandOneLine:false},line:{hideBranding:false,hideBrandAvatar:true,brandOneLine:true},avatarStacked:{hideBranding:false,hideBrandAvatar:false,brandOneLine:false},avatarLine:{hideBranding:false,hideBrandAvatar:false,brandOneLine:true}}}
];

export function proxyValue(proxy,inputs){
 return Object.entries(proxy.options).find(([,values])=>Object.entries(values).every(([id,value])=>read(inputs[id])===value))?.[0]??null;
}

function writeProxy(proxy,value,inputs){
 const values=proxy.options[value];
 if(!values)throw new Error(`Setting proxy ${proxy.id} has no option "${value}"`);
 for(const [id,next] of Object.entries(values)){
  const input=inputs[id];if(read(input)===next)continue;
  if(input.type==='checkbox')input.checked=next;else input.value=next;
  input.dispatchEvent(new Event('change',{bubbles:true}));
 }
}

/** Wires each proxy menu in `panel` to its switches; returns a refresh for state changed elsewhere.
 * `canChange` gates a whole choice: some switch handlers refuse changes mid-transition and others do not,
 * so writing only part of an option would store a combination no option describes. */
export function mountSettingProxies(panel,{proxies=SETTING_PROXIES,canChange=()=>true}={}){
 const mounted=proxies.map(proxy=>{
  const select=panel.querySelector('#'+proxy.id);
  if(!select)throw new Error(`Setting proxy menu #${proxy.id} is missing`);
  const ids=new Set(Object.values(proxy.options).flatMap(Object.keys)),inputs={};
  for(const id of ids){inputs[id]=panel.querySelector('#'+id);if(!inputs[id])throw new Error(`Setting proxy ${proxy.id} needs #${id}`);}
  return {proxy,select,inputs};
 });
 // A combination no option describes (set by an older import) shows as blank rather than a wrong choice.
 // While a choice is being written its switches pass through partial combinations; one refresh at the end suffices.
 let writing=false;
 const refresh=()=>{if(writing)return;for(const {proxy,select,inputs} of mounted)select.value=proxyValue(proxy,inputs)??'';};
 for(const {proxy,select,inputs} of mounted)select.addEventListener('change',()=>{
  if(!canChange()){refresh();return;}
  writing=true;
  try{writeProxy(proxy,select.value,inputs);}finally{writing=false;}
  refresh();
 });
 panel.addEventListener('change',event=>{if(!mounted.some(({select})=>select===event.target))refresh();});
 refresh();
 return refresh;
}
