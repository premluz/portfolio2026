// Normalize resolved CSS colors before morphing. Hover transitions can return
// Oklab rather than RGB. Conversions follow CSS Color 4 sample matrices:
// https://www.w3.org/TR/css-color-4/#color-conversion-code
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const matrix=(rows,values)=>rows.map(row=>row.reduce((sum,value,index)=>sum+value*values[index],0));
const xyzToRGB=xyz=>matrix([[12831/3959,-329/214,-1974/3959],[-851781/878810,1648619/878810,36519/878810],[705/12673,-2585/12673,705/667]],xyz);
const encode=value=>Math.abs(value)<=.0031308?12.92*value:Math.sign(value)*(1.055*Math.abs(value)**(1/2.4)-.055);
const decode=value=>Math.abs(value)<=.04045?value/12.92:Math.sign(value)*((Math.abs(value)+.055)/1.055)**2.4;
export function colorChannels(value){
 const text=String(value||'').trim().toLowerCase();
 if(text==='transparent')return [0,0,0,0];
 if(/^#[0-9a-f]{6}$/.test(text))return [1,3,5].map(start=>parseInt(text.slice(start,start+2),16)).concat(1);
 const match=text.match(/^(rgba?|color|oklab|oklch)\((.*)\)$/);if(!match)return null;
 let [,format,body]=match,space='';
 if(format==='color'){const parts=body.trim().split(/\s+/);space=parts.shift();body=parts.join(' ');}
 const tokens=body.match(/[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?%?/g);if(!tokens||tokens.length<3)return null;
 const number=(token,percentScale=1)=>parseFloat(token)*(token.endsWith('%')?percentScale/100:1);
 const alpha=clamp(tokens[3]===undefined?1:number(tokens[3]));
 let rgb=tokens.slice(0,3).map(token=>number(token,format.startsWith('rgb')?255:1));
 if(format==='oklab'||format==='oklch'){
  const lab=[number(tokens[0]),number(tokens[1],.4),number(tokens[2],.4)];
  if(format==='oklch'){const hue=parseFloat(tokens[2])*Math.PI/180;lab[2]=lab[1]*Math.sin(hue);lab[1]*=Math.cos(hue);}
  const lms=matrix([[1,.3963377773761749,.2158037573099136],[1,-.1055613458156586,-.0638541728258133],[1,-.0894841775298119,-1.2914855480194092]],lab).map(channel=>channel**3);
  const xyz=matrix([[1.2268798758459243,-.5578149944602171,.2813910456659647],[-.0405757452148008,1.112286803280317,-.0717110580655164],[-.0763729366746601,-.4214933324022432,1.5869240198367816]],lms);
  rgb=xyzToRGB(xyz).map(channel=>encode(channel)*255);
 }else if(format==='color'){
  if(space==='srgb')rgb=rgb.map(channel=>channel*255);
  else if(space==='srgb-linear')rgb=rgb.map(channel=>encode(channel)*255);
  else if(space==='display-p3')rgb=xyzToRGB(matrix([[608311/1250200,189793/714400,198249/1000160],[35783/156275,247089/357200,198249/2500400],[0,32229/714400,5220557/5000800]],rgb.map(decode))).map(channel=>encode(channel)*255);
  else return null;
 }
 return [...rgb.map(channel=>clamp(channel,0,255)),alpha];
}
export function colorInterpolator(from,to){
 const parsedStart=colorChannels(from),parsedEnd=colorChannels(to);
 const start=parsedStart||parsedEnd||[240,240,239,1],end=parsedEnd||start;
 // Premultiplied alpha preserves a light fill when fading to transparency.
 return progress=>{const p=clamp(progress),alpha=start[3]+(end[3]-start[3])*p;
  const rgb=start.slice(0,3).map((value,index)=>alpha>0?(value*start[3]*(1-p)+end[index]*end[3]*p)/alpha:0);
  return `rgba(${[...rgb,alpha].join(',')})`;
 };
}

// Convert authored project colours once, rather than doing colour math per frame.
export function oklchChannels(value){
 const rgb=colorChannels(value);if(!rgb)return null;
 const linear=rgb.slice(0,3).map(channel=>decode(channel/255));
 const lms=matrix([[.4122214708,.5363325363,.0514459929],[.2119034982,.6806995451,.1073969566],[.0883024619,.2817188376,.6299787005]],linear).map(Math.cbrt);
 const [lightness,a,b]=matrix([[.2104542553,.793617785,-.0040720468],[1.9779984951,-2.428592205,.4505937099],[.0259040371,.7827717662,-.808675766]],lms);
 const chroma=Math.hypot(a,b),hue=chroma<.000001?0:(Math.atan2(b,a)*180/Math.PI+360)%360;
 return [lightness,chroma,hue,rgb[3]];
}
// Card gradients have exactly two stops and one shared angle. Read resolved
// CSS colour functions, including computed Oklab during native hover transitions.
export function gradientInterpolator(from,to,fromColor='transparent',toColor='transparent'){
 const stops=(gradient,fallback)=>{
  const colors=String(gradient||'').match(/(?:rgba?|color|oklab|oklch)\([^)]*\)|#[0-9a-f]{6}/gi)||[];
  return colors.length>=2?[colors[0],colors.at(-1)]:[fallback,fallback];
 };
 const a=stops(from,fromColor),b=stops(to,toColor),start=colorInterpolator(a[0],b[0]),end=colorInterpolator(a[1],b[1]);
 return progress=>`linear-gradient(180deg in oklab,${start(progress)},${end(progress)})`;
}
