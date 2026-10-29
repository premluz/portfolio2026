export const CONTROL_STYLES=Object.freeze(['ghost','outline','glass']);
export const CONTROL_GROUPS=Object.freeze(['navigation','projects','carousels','suggestions','utilities']);
export const CONTROL_STYLE_KEY='prem-control-style';
export const controlGroupKey=group=>CONTROL_STYLE_KEY+'-'+group;
export const controlGroupInput=group=>'controlStyle'+group[0].toUpperCase()+group.slice(1);

function storedStyle(storage,key,fallback,choices){
 const value=storage?.getItem(key);
 if(value===null||value===undefined)return fallback;
 if(choices.includes(value))return value;
 console.warn(`Invalid control style in ${key}: ${value}; using ${fallback}.`);
 return fallback;
}
export function readControlPreferences(storage){
 try{
  const legacy=storage?.getItem('prem-plain-nav')==='true'?'ghost':storage?.getItem('prem-glass-style')==='false'?'outline':'glass';
  return {style:storedStyle(storage,CONTROL_STYLE_KEY,legacy,CONTROL_STYLES),groups:Object.fromEntries(CONTROL_GROUPS.map(group=>[group,storedStyle(storage,controlGroupKey(group),'inherit',['inherit',...CONTROL_STYLES])]))};
 }catch(error){
  console.warn('Control styles could not be read; using Glass with inherited groups.',error);
  return {style:'glass',groups:Object.fromEntries(CONTROL_GROUPS.map(group=>[group,'inherit']))};
 }
}
export function resolveControlStyle(global,group='inherit',local='inherit'){
 if(!CONTROL_STYLES.includes(global))throw Error('Invalid global control style: '+global);
 for(const [label,value] of [['group',group],['local',local]])if(value!=='inherit'&&!CONTROL_STYLES.includes(value))throw Error(`Invalid ${label} control style: ${value}`);
 return CONTROL_STYLES.includes(local)?local:CONTROL_STYLES.includes(group)?group:global;
}
export function seedControlPreferences(storage){
 const preferences=readControlPreferences(storage);
 if(storage.getItem(CONTROL_STYLE_KEY)===null)storage.setItem(CONTROL_STYLE_KEY,preferences.style);
 if(storage.getItem('prem-card-glass-style')===null)storage.setItem('prem-card-glass-style',String(storage.getItem('prem-glass-style')!=='false'));
}
