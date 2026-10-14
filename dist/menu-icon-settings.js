const controls={
 showGestureControl:{storage:'prem-menu-gesture-visible',button:'gesturePreference'},
 showInfoControl:{storage:'prem-menu-info-visible',button:'siteHelp'},
 showAnimationControl:{storage:'prem-menu-animation-visible',button:'animationPreference'}
};

function applyVisibility(toggle,button,enabled){
 toggle.setAttribute('aria-checked',String(enabled));
 if(button){button.hidden=!enabled;button.disabled=!enabled;}
}

export function mountMenuIconSettings(panel,menu,{storage=globalThis.localStorage}={}){
 for(const [id,config] of Object.entries(controls)){
  const toggle=panel.querySelector('#'+id);if(!toggle)continue;
  const button=menu.querySelector('#'+config.button);let saved;
  try{saved=storage?.getItem(config.storage);}catch{}
  let enabled=saved==='true';
  applyVisibility(toggle,button,enabled);
  toggle.addEventListener('click',()=>{
   enabled=!enabled;applyVisibility(toggle,button,enabled);
   try{storage?.setItem(config.storage,String(enabled));}catch{}
  });
 }
}
