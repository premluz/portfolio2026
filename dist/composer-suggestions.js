import {EASE} from './motion-tokens.js';
// Reversible word-sized chips: left-to-right entrance, right-to-left exit.
// The promise settles before contextual glass is allowed to expand again.
export class ComposerSuggestions {
 constructor(node,{reduced=()=>false}={}){this.node=node;this.reduced=reduced;this.animations=[];this.epoch=0;}
 async setVisible(visible,{immediate=false}={}){
  const epoch=++this.epoch,buttons=[...this.node.querySelectorAll('button')],snapshots=buttons.map(button=>({opacity:getComputedStyle(button).opacity,transform:getComputedStyle(button).transform}));
  this.animations.forEach(animation=>animation.cancel());this.animations=[];
  if(!visible&&this.node.hidden)return;
  const wasHidden=this.node.hidden;this.node.hidden=false;this.node.inert=!visible;dispatchEvent(new Event('composer-overlay-change'));
  if(!immediate&&!this.reduced())this.animations=buttons.map((button,index)=>button.animate([
   visible&&wasHidden?{opacity:0,transform:'translateY(7px)'}:snapshots[index],
   {opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(7px)'}
  ],{duration:visible?180:120,delay:(visible?index:buttons.length-1-index)*(visible?30:25),easing:visible?EASE.settle:EASE.leave,fill:'both'}));
  await Promise.all(this.animations.map(animation=>animation.finished.catch(()=>{})));
  if(epoch!==this.epoch)return false;
  this.node.hidden=!visible;this.animations.forEach(animation=>animation.cancel());this.animations=[];dispatchEvent(new Event('composer-overlay-change'));return true;
 }
}
