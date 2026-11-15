import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStageReveal} from '../dist/feature-stage-reveal.js';

// A fake IntersectionObserver that the test drives by hand.
function environment(){
 const observers=[];
 class IntersectionObserver{constructor(callback){this.callback=callback;this.targets=new Set();observers.push(this);}observe(node){this.targets.add(node);}disconnect(){this.targets.clear();}}
 const report=(card,ratio)=>{for(const observer of observers)if(observer.targets.has(card))observer.callback([{target:card,intersectionRatio:ratio,isIntersecting:ratio>0}]);};
 return {env:{IntersectionObserver},report};
}
function gallery(ids){
 const make=id=>({dataset:{contentCard:id,featureStage:'true'}});
 const node={dataset:{},cards:ids.map(make),querySelectorAll(selector){return selector==='[data-stage-in-view]'?this.cards.filter(card=>'stageInView' in card.dataset):this.cards;},rerender(){this.cards=ids.map(make);}};
 return node;
}

{
 const {env,report}=environment();const g=gallery(['replay-a']);const card=g.cards[0];
 createStageReveal(g,{environment:env});
 report(card,.5);assert.equal(card.dataset.stageInView,'true','Default: a stage in view reveals');
 report(card,0);assert.equal(card.dataset.stageInView,undefined,'Default: a stage that left the screen resets so it replays');
}
{
 const {env,report}=environment();const g=gallery(['once-a']);const card=g.cards[0];
 const reveal=createStageReveal(g,{environment:env,once:true});
 report(card,.5);report(card,0);
 assert.equal(card.dataset.stageInView,'true','Once: leaving the screen does not reset a revealed stage');
 g.rerender();reveal.sync();
 assert.equal(g.cards[0].dataset.stageInView,'true','Once: a re-rendered stage that already played stays at rest');
 const {env:next}=environment();const g2=gallery(['once-a','once-b']);createStageReveal(g2,{environment:next,once:true});
 assert.equal(g2.cards[0].dataset.stageInView,'true','Once: a new reveal in the same visit remembers played stages');
 assert.equal(g2.cards[1].dataset.stageInView,undefined,'Once: an unplayed stage still starts hidden');
}
{
 const [defaults,transfer,page]=await Promise.all(['default-settings.js','settings-transfer.js','index.html'].map(file=>readFile(new URL('../dist/'+file,import.meta.url),'utf8')));
 assert.match(defaults,/'prem-stage-reveal-once':'false'/,'The setting starts off (ADR-005)');
 assert.match(transfer,/stageRevealOnce:'prem-stage-reveal-once'/,'The setting is exported and imported');
 assert.match(page,/id="stageRevealOnce" type="checkbox"/,'The control lives in index.html');
}
console.log('Feature stage reveal passed: default replays on every pass; once plays each stage once per visit, across re-renders; setting off by default, exported, in index.html.');
