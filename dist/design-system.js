const sizes=['small','medium','large'];
const weights=['thin','regular','bold'];
// Heading size overrides the heading half of Text size (ADR-006); Auto keeps Text size in charge of both.
const headingSizes=['auto','small','medium','large','xlarge','display'];
const headingSizeLabels={auto:'Auto (follows Text size)',small:'Small',medium:'Medium',large:'Large',xlarge:'Extra large',display:'Display'};
// Spacing is a density multiplier, so it can reach further either way than the text presets (design-system.css).
const spaceSizes=['xsmall','small','medium','large','xlarge','xxlarge'];
const spaceSizeLabels={xsmall:'Extra small',small:'Small',medium:'Medium',large:'Large',xlarge:'Extra large',xxlarge:'Extra extra large'};
const optionLabel=(key,option)=>key==='headingWeight'||key==='bodyWeight'?({thin:'Thin (300)',regular:'Regular (400)',bold:'Bold (500)'}[option]):key==='headingSize'?headingSizeLabels[option]:key==='spaceSize'||key==='rhythmSize'?spaceSizeLabels[option]:option[0].toUpperCase()+option.slice(1);
const controls=[['typeSize','Text size',sizes],['headingSize','Heading size',headingSizes],['spaceSize','Spacing',spaceSizes],['rhythmSize','Section spacing',spaceSizes],['logoSize','Logo size',sizes],['headingWeight','Header weight',weights],['bodyWeight','Body weight',weights],['typeTracking','Letter spacing',sizes],['typeLeading','Line spacing',sizes]];
export {controls as designSettingControls};
export function normalizeDesignSettings(value={}){
 const legacyWeight={small:'thin',medium:'regular',large:'bold'}[value?.typeWeight]||'regular';
 return Object.fromEntries(controls.map(([key,,options])=>[key,options.includes(value?.[key])?value[key]:key==='headingWeight'||key==='bodyWeight'?legacyWeight:key==='headingSize'?'auto':'medium']));
}
export function applyDesignSettings(root,value){
 const settings=normalizeDesignSettings(value);for(const [key] of controls)root.dataset[key]=settings[key];return settings;
}
export function initDesignSystem(panel,{canChange=()=>true,onChange=()=>{}}={}){
 let saved;try{saved=JSON.parse(localStorage.getItem('prem-design-system')||'null');}catch{}
 let settings=applyDesignSettings(document.documentElement,saved);
 const fieldset=document.createElement('fieldset');fieldset.className='design-system-controls';
 fieldset.innerHTML=`<legend>Type and spacing</legend>${controls.map(([key,label,options])=>`<label>${label}<select data-design-control="${key}" aria-label="${label}">${options.map(option=>`<option value="${option}">${optionLabel(key,option)}</option>`).join('')}</select></label>`).join('')}<p>Text weight: Thin (300), Regular (400), or Bold (500). Text size and logo size have three presets; spacing has six, from Extra small to Extra extra large. Section spacing sets the vertical gaps between page sections on top of Spacing; logo size is independent of both. Heading size, when not Auto, sets heading size on its own, up to a Display scale for hero-style titles.</p>`;
 const slot=panel.querySelector('[data-settings-slot="design-system"]');
 if(slot)slot.append(fieldset);else panel.querySelector('.panel-heading').after(fieldset);
 for(const select of fieldset.querySelectorAll('select')){
  const key=select.dataset.designControl;select.value=settings[key];
  select.onchange=()=>{
   if(!canChange()){select.value=settings[key];return;}
   settings=applyDesignSettings(document.documentElement,{...settings,[key]:select.value});
   try{localStorage.setItem('prem-design-system',JSON.stringify(settings));}catch{}
   onChange(settings);
  };
 }
 return settings;
}
