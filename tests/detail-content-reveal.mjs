import assert from 'node:assert/strict';
import {createDetailContentReveal,bindDetailContentReveal} from '../dist/detail-content-reveal.js';

const calls=[];
function element(opacity=''){
 return {style:{opacity},animate(frames,options){
  const animation={frames,options,onfinish:null,cancelled:false,reversed:false,cancel(){this.cancelled=true;},reverse(){this.reversed=true;}};
  calls.push({node:this,animation});return animation;
 }};
}
const factRole=element('0.4'),factHighlights=element(),factKeyWork=element(),factExtra=element(),footer=element(),blockA=element(),blockB=element();
const description={querySelectorAll:()=>[factRole,factHighlights,factKeyWork,factExtra]};
const detail={classList:{contains:()=>false},querySelector:selector=>selector==='.description'?description:null};
const story={children:[blockA,blockB]};
const root={
 querySelector(selector){return selector==='.detail:not(.info-detail)'?detail:selector===':scope > .detail-footer'?footer:null;},
 querySelectorAll(selector){return selector===':scope > .story'?[story]:[];}
};
const reveal=createDetailContentReveal(root);
assert.deepEqual([factRole,factHighlights,factKeyWork,factExtra,footer,blockA,blockB].map(node=>node.style.opacity),['0','0','0','0','0','0','0'],'New details are held until the summary is nearly finished');
assert.equal(calls.length,0);
reveal.start();assert.equal(calls.length,7);
assert.deepEqual(calls.map(({animation})=>animation.options.delay),[0,44,88,132,176,220,240],'Each discovered fact and story item gets its own stagger');
assert.equal(calls[0].animation.options.duration,220,'The detail settle is shorter than the previous reveal');
assert.deepEqual(calls[0].animation.frames,[{opacity:0},{opacity:1}],'Sections fade without directional sliding');
calls[0].animation.onfinish();assert.equal(factRole.style.opacity,'0.4','Original opacity is restored after the animation');
reveal.reverse();assert(calls.slice(1).every(({animation})=>animation.reversed),'Escape reverses sections already entering');assert.equal(factRole.style.opacity,'0','Finished sections hide as the page reverses');
reveal.cancel();assert(calls.slice(1).every(({animation})=>animation.cancelled));
assert.deepEqual([factHighlights,factKeyWork,factExtra,footer,blockA,blockB].map(node=>node.style.opacity),['','','','','',''],'Cancelling the reveal restores the page');

const instantNode=element(),instantDescription={querySelectorAll:()=>[instantNode]},instantDetail={classList:{contains:()=>false},querySelector:selector=>selector==='.description'?instantDescription:null};
const instant=createDetailContentReveal({querySelector:selector=>selector==='.detail:not(.info-detail)'?instantDetail:null,querySelectorAll:()=>[]},{reduced:true});
assert.equal(instantNode.style.opacity,'','Reduced motion never hides page content');instant.start();assert.equal(calls.length,7);instant.cancel();
console.log('Detail content reveal passed: summary overlap, independent fact fading, stagger timing, Escape reversal and reduced-motion safety.');

// Morph content starts as a zero-opacity clone. Its facts must track the live
// animation's computed opacity, including reversal, rather than wait for docking.
const cloneFacts=Array.from({length:4},()=>element('0'));
const cloneDetail={matches:()=>true,querySelector:selector=>selector==='.description'?{querySelectorAll:()=>cloneFacts}:null};
const sourceDetail={...detail,matches:()=>true};
const phases=new Map([[factRole,'0.8'],[factHighlights,'0.5'],[factKeyWork,'0.2'],[factExtra,'0']]);
globalThis.getComputedStyle=node=>({opacity:phases.get(node)||node.style.opacity||'1'});
const paint=bindDetailContentReveal(sourceDetail,cloneDetail),before=calls.length;paint();
assert.deepEqual(cloneFacts.map(node=>node.style.opacity),['0.8','0.5','0.2','0'],'Each fact mirrors its own stagger phase while the cloned panel is moving');
phases.set(factRole,'0.3');phases.set(factHighlights,'0.1');phases.set(factKeyWork,'0');paint();
assert.deepEqual(cloneFacts.map(node=>node.style.opacity),['0.3','0.1','0','0'],'Escape/reversal uses the current live phase without restarting the reveal');
assert.equal(calls.length,before,'Binding reuses existing animations; it does not create competing ones');
