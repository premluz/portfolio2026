// Lab grid rules (Developer settings → Lab). They override the global card settings on the Lab route only,
// so Work, its carousel and every other page keep their own card settings.
export const LAB_DEFAULTS=Object.freeze({layout:'masonry',columns:4,featuredLarger:false,cardDetails:true,fullWidth:false,heading:true});
const KEYS=Object.freeze({layout:'prem-lab-layout',columns:'prem-lab-columns',featuredLarger:'prem-lab-featured-larger',cardDetails:'prem-lab-card-details',fullWidth:'prem-lab-full-width',heading:'prem-lab-heading'});
const CONTROLS=Object.freeze({layout:'labLayout',columns:'labColumns',featuredLarger:'labFeaturedLarger',cardDetails:'labCardDetails',fullWidth:'labFullWidth',heading:'labHeading'});
const LAYOUTS=['masonry','regular'];
const flag=(value,fallback)=>value===undefined||value===null?fallback:String(value)==='true';

export function normaliseLabSettings(raw={}){
 const columns=Number(raw.columns);
 return {layout:LAYOUTS.includes(raw.layout)?raw.layout:LAB_DEFAULTS.layout,columns:Number.isInteger(columns)&&columns>=1&&columns<=4?columns:LAB_DEFAULTS.columns,featuredLarger:flag(raw.featuredLarger,LAB_DEFAULTS.featuredLarger),cardDetails:flag(raw.cardDetails,LAB_DEFAULTS.cardDetails),fullWidth:flag(raw.fullWidth,LAB_DEFAULTS.fullWidth),heading:flag(raw.heading,LAB_DEFAULTS.heading)};
}
export function readLabSettings(storage){
 try{return normaliseLabSettings(Object.fromEntries(Object.entries(KEYS).map(([name,key])=>[name,storage?.getItem(key)])));}
 catch(error){console.warn('Lab settings unreadable; using the defaults',error);return {...LAB_DEFAULTS};}
}
/** Wires the Lab controls in `root`; returns the live settings object, updated in place on every change. */
export function mountLabSettings(root,{storage=globalThis.localStorage,onChange=()=>{}}={}){
 const state=readLabSettings(storage),controls=Object.fromEntries(Object.entries(CONTROLS).map(([name,id])=>[name,root.querySelector('#'+id)]));
 const sync=()=>{controls.layout.value=state.layout;controls.columns.value=String(state.columns);controls.featuredLarger.checked=state.featuredLarger;controls.cardDetails.checked=state.cardDetails;controls.fullWidth.checked=state.fullWidth;controls.heading.checked=state.heading;};
 for(const [name,control] of Object.entries(controls))control.onchange=()=>{
  Object.assign(state,normaliseLabSettings({...state,[name]:control.type==='checkbox'?control.checked:control.value}));sync();
  try{storage?.setItem(KEYS[name],String(state[name]));}catch(error){console.warn('Lab setting not saved',error);}
  onChange(state);
 };
 sync();return state;
}
