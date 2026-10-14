// Validates the JSON Schema keywords used by our content contract. The exported
// schema is also consumable by full JSON Schema validators and CMS tooling.
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const kinds={object:plain,array:Array.isArray,string:v=>typeof v==='string',boolean:v=>typeof v==='boolean',number:v=>typeof v==='number'&&Number.isFinite(v),integer:v=>Number.isSafeInteger(v)};
export function validateSchema(value,schema){
 const issues=[],ancestors=new WeakSet();
 function check(v,s,path,depth=0){
  if(issues.length>=100)return;
  if(depth>60){issues.push(path+': structure is too deep');return;}
  if(s.$ref){const target=s.$ref.split('/').slice(1).reduce((node,key)=>node?.[key],schema);if(!target)throw new Error('Unknown schema reference '+s.$ref);check(v,target,path,depth+1);return;}
  if(s.anyOf){
   const matches=s.anyOf.filter(branch=>!branch.$ref||!v?.type||schema.$defs[branch.$ref.split('/').at(-1)]?.properties?.type?.const===v.type);
   if(!matches.length){issues.push(path+': unknown content type '+String(v?.type));return;}
   let nearest,valid=false;
   for(const branch of matches){const start=issues.length;check(v,branch,path,depth+1);const errors=issues.splice(start);if(!errors.length){valid=true;break;}if(!nearest||errors.length<nearest.length)nearest=errors;}
   if(!valid)issues.push(...nearest);
  }
  if(s.type&&!kinds[s.type]?.(v)){issues.push(path+': expected '+s.type);return;}
  if('const' in s&&v!==s.const)issues.push(path+': expected '+JSON.stringify(s.const));
  if(s.enum&&!s.enum.includes(v))issues.push(path+': unsupported value '+String(v));
  if(typeof v==='string'){
   if(s.maxLength!==undefined&&v.length>s.maxLength)issues.push(path+': text is too long');
   if(s.minLength!==undefined&&v.length<s.minLength)issues.push(path+': text is too short');
   if(s.pattern&&!new RegExp(s.pattern).test(v))issues.push(path+': invalid format');
  }
  if(typeof v==='number'){if(s.minimum!==undefined&&v<s.minimum)issues.push(path+': below minimum');if(s.maximum!==undefined&&v>s.maximum)issues.push(path+': above maximum');}
  if(v&&typeof v==='object'){
   if(ancestors.has(v)){issues.push(path+': cyclic JSON data');return;}ancestors.add(v);
   if(Array.isArray(v)){
    if(s.minItems!==undefined&&v.length<s.minItems)issues.push(path+': too few items');if(s.maxItems!==undefined&&v.length>s.maxItems)issues.push(path+': too many items');
    if(s.uniqueItems){try{if(new Set(v.map(item=>JSON.stringify(item))).size!==v.length)issues.push(path+': duplicate values');}catch{issues.push(path+': cyclic JSON data');}}
    if(s.items)v.forEach((item,index)=>check(item,s.items,path+'['+index+']',depth+1));
   }else if(plain(v)){
    for(const key of s.required||[])if(!Object.hasOwn(v,key))issues.push(path+'.'+key+': required');
    for(const key of Object.keys(v)){if(s.properties?.[key])check(v[key],s.properties[key],path+'.'+key,depth+1);else if(s.additionalProperties===false)issues.push(path+'.'+key+': unknown field');}
   }
   ancestors.delete(v);
  }
 }
 check(value,schema,'catalog');return issues;
}
