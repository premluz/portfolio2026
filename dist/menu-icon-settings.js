import {setIconSwitchState,switchIcon} from './icon-switch.js';

const choices={
 menuGestureIcon:{storage:'prem-menu-gesture-icon',button:'gesturePreference',fallback:'hand',presets:{hand:['hand','hand'],fingers:['fingers','fingers']}},
 menuInfoIcon:{storage:'prem-menu-info-icon',button:'siteHelp',fallback:'help',presets:{help:'help',info:'info'}},
 menuAnimationIcon:{storage:'prem-menu-animation-icon',button:'animationPreference',fallback:'motion',presets:{motion:['still','motion'],play:['play','pause']}}
};

export function menuIconPreset(setting,value){
 const config=choices[setting];
 return config?.presets[value]||config?.presets[config.fallback]||null;
}

function applyChoice(setting,value,menu){
 const config=choices[setting],button=menu.querySelector('#'+config.button),preset=menuIconPreset(setting,value);
 if(!button||!preset)return;
 if(setting==='menuInfoIcon')button.innerHTML=switchIcon(preset);
 else{
  button.dataset.switchIcons=preset.join(',');
  setIconSwitchState(button,button.dataset.state||(config.button==='animationPreference'?'on':'off'));
 }
}

export function mountMenuIconSettings(panel,menu,{storage=globalThis.localStorage}={}){
 for(const [id,config] of Object.entries(choices)){
  const select=panel.querySelector('#'+id);if(!select)continue;
  let saved;try{saved=storage?.getItem(config.storage);}catch{}
  select.value=Object.hasOwn(config.presets,saved)?saved:config.fallback;
  applyChoice(id,select.value,menu);
  select.addEventListener('change',()=>{
   const value=Object.hasOwn(config.presets,select.value)?select.value:config.fallback;
   select.value=value;applyChoice(id,value,menu);
   try{storage?.setItem(config.storage,value);}catch{}
  });
 }
}
