import assert from 'node:assert/strict';
import {mountProjectRouteAliases} from '../dist/project-route-aliases.js';

function browser(hash){
 const target=new EventTarget();
 target.location={hash};
 target.replacements=[];
 target.history={state:{entry:'preserved'},replaceState(state,title,route){
  assert.deepEqual(state,{entry:'preserved'});
  target.location.hash=route;target.replacements.push(route);
 }};
 return target;
}
for(const [legacy,current] of [['#planner','#rios'],['#planner-02','#rios-02']]){
 const target=browser(legacy),unmount=mountProjectRouteAliases(target);
 assert.equal(target.location.hash,current,'Old bookmarks normalize on initial load');
 target.location.hash='#work';target.dispatchEvent(new Event('hashchange'));
 let routed;
 target.addEventListener('hashchange',()=>{routed=target.location.hash;});
 target.location.hash=legacy;target.dispatchEvent(new Event('hashchange'));
 assert.equal(routed,current,'The router sees the canonical URL on hash navigation');
 assert.deepEqual(target.replacements,[current,current]);
 unmount();target.location.hash=legacy;target.dispatchEvent(new Event('hashchange'));
 assert.equal(target.location.hash,legacy,'Cleanup removes the compatibility listener');
}
for(const hash of ['','#work','#rios','#rios-02','#tracr','#tracr-02','#daily-planner','#planner-unknown']){
 const target=browser(hash),unmount=mountProjectRouteAliases(target);
 target.dispatchEvent(new Event('hashchange'));
 assert.equal(target.location.hash,hash);assert.deepEqual(target.replacements,[]);
 unmount();
}
console.log('Project route aliases passed: initial bookmarks, hash changes, canonical/unknown routes, history preservation and cleanup.');
