export const MASCOT_FIELDS=Object.freeze({
 mascotMaterial:'material',mascotPalette:'palette',mascotGlow:'glow',
 mascotGlowTint:'glowTint',mascotMotion:'motion',mascotVariety:'variety'
});
export const MASCOT_STORAGE_KEYS=Object.freeze({...Object.fromEntries(Object.entries(MASCOT_FIELDS).map(([id,key])=>[id,'prem-mascot-'+key])),mascotSpeed:'prem-mascot-speed'});
export const MASCOT_SETTINGS_EVENT='mascott-settings-change';
export const MASCOT_SPEED_EVENT='mascott-speed-change';
const NORMAL_SPEED=100;

function controlFor(root,id){
 const control=root.querySelector('#'+id);
 if(!control)throw new Error('Mascott settings control is missing: '+id);
 return control;
}
const valid=(control,value)=>[...control.options].some(option=>option.value===value);

export function readMascotLook(root=document){
 return Object.fromEntries(Object.entries(MASCOT_FIELDS).map(([id,key])=>{
  const control=controlFor(root,id);
  if(!valid(control,control.value))throw new Error('Invalid Mascott setting: '+id);
  return [key,control.value];
 }));
}

function validSpeed(control,value){
 return Number.isFinite(value)&&value>=Number(control.min)&&value<=Number(control.max);
}

export function readMascotSpeed(root=document){
 const control=controlFor(root,'mascotSpeed'),value=Number(control.value);
 if(!validSpeed(control,value))throw new Error('Invalid Mascott speed: '+control.value);
 return value/NORMAL_SPEED;
}

function mountSpeed(root,storage){
 const control=controlFor(root,'mascotSpeed'),output=controlFor(root,'mascotSpeedValue'),status=controlFor(root,'mascotSettingsStatus');
 try{
  const saved=storage?.getItem(MASCOT_STORAGE_KEYS.mascotSpeed);
  if(saved!==null&&saved!==undefined){
   if(!validSpeed(control,Number(saved)))throw new Error('Invalid saved Mascott speed: '+saved);
   control.value=saved;
  }
 }catch(error){console.warn('Mascott speed could not be restored.',error);status.textContent='The saved Mascott speed could not be restored.';}
 const sync=()=>{output.value=control.value+'%';};
 control.addEventListener('input',()=>{
  readMascotSpeed(root);sync();status.textContent='Mascott speed updated.';
  try{storage?.setItem(MASCOT_STORAGE_KEYS.mascotSpeed,control.value);}
  catch(error){console.warn('Mascott speed could not be saved.',error);status.textContent='Mascott speed updated, but could not be saved.';}
  root.dispatchEvent(new CustomEvent(MASCOT_SPEED_EVENT));
 });
 sync();
}

function syncEffects(root){
 const material=controlFor(root,'mascotMaterial').value,glow=controlFor(root,'mascotGlow').value;
 for(const [id,disabled] of [['mascotVariety',!['liquid','aura'].includes(material)],['mascotGlowTint',glow==='off']]){
  const control=controlFor(root,id);control.disabled=disabled;
  control.closest('label').classList.toggle('setting-disabled',disabled);
 }
}

export function mountMascotSettings(root=document,{storage=globalThis.localStorage}={}){
 const status=controlFor(root,'mascotSettingsStatus');
 mountSpeed(root,storage);
 for(const id of Object.keys(MASCOT_FIELDS)){
  const control=controlFor(root,id),key=MASCOT_STORAGE_KEYS[id];
  try{
   const saved=storage?.getItem(key);
   if(saved!==null&&saved!==undefined){
    if(!valid(control,saved))throw new Error('Invalid saved Mascott setting: '+id);
    control.value=saved;
   }
  }catch(error){console.warn('Mascott setting could not be restored.',error);status.textContent='A saved Mascott setting could not be restored.';}
  control.addEventListener('change',()=>{
   if(!valid(control,control.value))throw new Error('Invalid Mascott setting: '+id);
   status.textContent='Mascott updated.';
   try{storage?.setItem(key,control.value);}
   catch(error){console.warn('Mascott setting could not be saved.',error);status.textContent='Mascott updated, but this setting could not be saved.';}
   syncEffects(root);root.dispatchEvent(new CustomEvent(MASCOT_SETTINGS_EVENT));
  });
 }
 syncEffects(root);
}
