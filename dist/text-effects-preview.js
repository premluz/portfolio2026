import {streamText} from './assistant-text-stream.js';
import {mountThinkingIndicator} from './iconiq-chat-effects.js';
import {mountTextEffectSettings} from './text-effects-settings.js';

// Developer settings › Motion › Assistant text effects: the controls, and a replay that runs the saved settings
// through the same code the assistant uses, so a change can be judged without asking a question.
const SAMPLE='Prem designs products for technical and expert users, with a focus on conversational and generative AI experiences.';

export function mountTextEffects(panel,{reduced=()=>false,storage}={}){
 const settings=mountTextEffectSettings(panel,{storage}),preview=panel.querySelector('#textEffectPreview'),thinking=panel.querySelector('#textEffectThinking'),replay=panel.querySelector('#textEffectReplay');
 if(!preview||!thinking||!replay)throw new Error('Text effects preview: #textEffectPreview, #textEffectThinking and #textEffectReplay are required in the settings panel');
 let stop=()=>{};
 replay.addEventListener('click',()=>{
  stop();preview.textContent='';
  stop=streamText(preview,SAMPLE,{reduced:reduced()});
  const status=document.createElement('div');thinking.replaceChildren(status);
  mountThinkingIndicator(status,{reduced:reduced()});
 });
 return settings;
}
