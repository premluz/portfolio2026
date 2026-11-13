import {streamText} from './assistant-text-stream.js';
import {mountThinkingIndicator} from './iconiq-chat-effects.js';
import {TEXT_EFFECTS_KEY,TEXT_EFFECT_CONTROLS,heroGlimmerOptions,normalizeValue,readTextEffects} from './text-effects-settings.js';
import {applyHeroGlimmer,replayHeroGlimmer} from './text-glimmer.js';

// Developer settings › Motion › Assistant text effects. Only the developer panel needs this module, so app.js loads
// it on ?dev=1 and public visitors never download it. It binds the controls, and a replay runs the saved settings
// through the same code the assistant uses, so a change can be judged without asking a question.
const SAMPLE='Prem designs products for technical and expert users, with a focus on conversational and generative AI experiences.';

function bind(panel,key,control,value,save){
 const input=panel.querySelector(`[data-text-effect-control="${key}"]`),output=panel.querySelector(`[data-text-effect-output="${key}"]`);
 if(!input)throw new Error(`Text effect control "${key}" is missing from the settings panel`);
 const show=()=>{if(control.type==='toggle')input.checked=value[key];else input.value=String(value[key]);if(output)output.value=value[key]+control.unit;};
 show();
 input.addEventListener(control.type==='range'?'input':'change',()=>{
  value[key]=normalizeValue(control,control.type==='toggle'?input.checked:control.type==='range'?Number(input.value):input.value);show();save();
 });
}
export function mountTextEffectSettings(panel,{storage,onChange=()=>{}}={}){
 try{storage??=globalThis.localStorage;}catch(error){console.warn('Text effect settings cannot be saved: storage is unavailable',error);}
 const value=readTextEffects(storage);
 const save=()=>{try{storage?.setItem(TEXT_EFFECTS_KEY,JSON.stringify(value));}catch(error){console.warn('Text effect settings not saved',error);}onChange({...value});};
 for(const [key,control] of Object.entries(TEXT_EFFECT_CONTROLS))bind(panel,key,control,value,save);
 return {get value(){return {...value};}};
}

// Why the hero heading is or is not glimmering, in words, so a missing sweep is never a mystery.
export function heroGlimmerStatus({settings,root,reducedMotion}){
 if(!settings.heroGlimmer)return 'off. Switch it on above.';
 if(reducedMotion)return 'not playing: this device asks for reduced motion (macOS: System Settings › Accessibility › Display › Reduce motion).';
 if(root.getAttribute('data-animation')==='off')return 'not playing: Animation is off in the site settings.';
 if(root.querySelector('#main')?.classList.contains('home-view-split'))return 'not playing: the Flip and Flat home views show project titles instead of the heading.';
 const heading=root.querySelector('.home-canvas [data-hero-title]');
 if(heading?.getAnimations?.().some(animation=>animation.animationName?.startsWith('text-glimmer')&&animation.playState==='running'))return 'playing.';
 if(heading?.hasAttribute('data-glimmer-done'))return `played ${settings.heroGlimmerPlays}× on landing. Replay effects plays it again.`;
 return 'on. It plays when the home page lands.';
}

export function mountTextEffects(panel,{reduced=()=>false,storage,root=document.documentElement}={}){
 const status=panel.querySelector('#heroGlimmerStatus'),motion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(!status)throw new Error('Text effects: #heroGlimmerStatus is required in the settings panel');
 let current=readTextEffects(storage);
 const refresh=()=>{status.value=heroGlimmerStatus({settings:current,root,reducedMotion:!!motion?.matches});};
 const settings=mountTextEffectSettings(panel,{storage,onChange:value=>{current=value;applyHeroGlimmer(root,heroGlimmerOptions(value));requestAnimationFrame(refresh);}}),preview=panel.querySelector('#textEffectPreview'),thinking=panel.querySelector('#textEffectThinking'),replay=panel.querySelector('#textEffectReplay');
 if(!preview||!thinking||!replay)throw new Error('Text effects preview: #textEffectPreview, #textEffectThinking and #textEffectReplay are required in the settings panel');
 let stop=()=>{};
 replay.addEventListener('click',()=>{
  replayHeroGlimmer(root);
  stop();preview.textContent='';
  stop=streamText(preview,SAMPLE,{reduced:reduced()});
  const indicator=document.createElement('div');thinking.replaceChildren(indicator);
  mountThinkingIndicator(indicator,{reduced:reduced()});
  requestAnimationFrame(refresh);
 });
 for(const type of ['animationstart','animationend'])root.addEventListener(type,event=>{if(event.animationName?.startsWith('text-glimmer'))refresh();});
 motion?.addEventListener?.('change',refresh);addEventListener('hashchange',()=>setTimeout(refresh,0));
 refresh();
 return settings;
}
