import {EASE} from './motion-tokens.js';
import {morphProgress} from './transition-control.js';

const outward={top:'translate3d(0,-100%,0)',bottom:'translate3d(0,100%,0)',left:'translate3d(-100%,0,0)',right:'translate3d(100%,0,0)'};
const home='translate3d(0,0,0)';
// Edge shade depth and enabled sides remain preferences. Route motion changes
// only the overlay's opacity and position, using the card's reversible clock.
export class EdgeShades {
 constructor(root,{reduced=()=>false}={}){
  this.root=root;this.reduced=reduced;this.retreat=true;this.details=false;this.hidden=false;
  this.edges=[...root.querySelectorAll('i')].map(node=>({node,side:Object.keys(outward).find(side=>node.classList.contains(side))}));
  this.sync(false);
 }
 setRetreat(value){if(this.retreat===value)return;this.retreat=value;this.sync(this.details);}
 sync(details){
  this.details=details;this.hidden=this.retreat&&details;
  this.root.dataset.retreated=String(this.hidden);
 }
 animateTo(details,control,duration){
  const from=this.hidden,to=this.retreat&&details;
  if(from===to||this.reduced()||!control){this.sync(details);return;}
  const options={duration,easing:control.timeline?'linear':EASE.settle,fill:'both'};
  control.track(this.root.animate([{opacity:from?0:1},{opacity:to?0:1}],options),morphProgress);
  for(const {node,side} of this.edges){
   if(!side)continue;
   control.track(node.animate([{transform:from?outward[side]:home},{transform:to?outward[side]:home}],options),morphProgress);
  }
 }
}
