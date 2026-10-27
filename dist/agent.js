// Mounts the agent: one body beside the composer (or the Assistant button when the composer is hidden) that
// comes over when the visitor hovers something a scene knows about. See MOTION.md → Character.
import {AGENT} from './motion-tokens.js';
import {createAgentBody} from './agent-body.js';
import {createAgentWorld} from './agent-world.js';
import {AgentEngine} from './agent-engine.js';
import {mountAgentScenes} from './agent-scenes.js';

export function mountAgent({doc=document,win=window,reduced=()=>false}={}){
 const body=createAgentBody(doc),world=createAgentWorld({doc,win,gap:AGENT.seatGap});
 const engine=new AgentEngine({body,world,reduced}),scenes=mountAgentScenes(engine,{doc,win});
 // Home follows the dock: it changes size on route changes and swaps the composer for the Assistant button.
 const refresh=()=>engine.refreshHome(),dock=doc.getElementById('dock');
 const resized=new ResizeObserver(refresh),toggled=new MutationObserver(refresh);
 for(const id of ['dock','askForm','assistantLauncher','assistantMascot']){const node=doc.getElementById(id);if(node){resized.observe(node);toggled.observe(node,{attributes:true,attributeFilter:['hidden','class']});}}
 // The chat page's stage scrolls with the page and settles at the end of its fade-in, so follow both.
 const settle=()=>{refresh();Promise.all((doc.getElementById('askPage')?.getAnimations?.()||[]).map(animation=>animation.finished)).then(refresh,refresh);};
 win.addEventListener('resize',refresh);win.addEventListener('scroll',refresh,{passive:true});win.addEventListener('portfolio-route-settled',settle);dock?.addEventListener('transitionend',refresh);
 body.ready().then(()=>engine.appear()).catch(error=>console.error('The agent could not appear.',error));
 return {engine,destroy(){resized.disconnect();toggled.disconnect();win.removeEventListener('resize',refresh);win.removeEventListener('scroll',refresh);win.removeEventListener('portfolio-route-settled',settle);dock?.removeEventListener('transitionend',refresh);scenes.destroy();engine.destroy();}};
}
