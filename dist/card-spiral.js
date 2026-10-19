import * as THREE from './vendor/three/three.module.js';
import {SPIRAL_DEFAULTS,sectionProgress,spiralPhases,spiralSlot,spiralPose,gridPose,cardMorph,blendPose,gridColumns,smooth,introState,revealAlpha} from './card-spiral-layout.js';
import {createSpiralGuides} from './card-spiral-guides.js';
import {themeColor} from './card-world.js';

// Spiral arrangement of the card world: a slow six-arm conveyor of upright cards over guide circles.
// Scrolling its pinned section advances the cards along their tracks, then unwinds them into a tilted,
// browsable grid with depth of field. World units are CSS pixels (the camera sits so z=0 is 1:1).
const FOV=30,CARD_ASPECT=.72,RADIUS=18,DESKTOP_CARDS=32,MOBILE_CARDS=14,MOBILE_WIDTH=700;
// Cards stay clear like carousel cards: only the browsable grid gets a soft depth of field.
const HOVER_SCALE=1.04,HOVER_EASE=.14,GRID_BLUR=.7;

export function createSpiralArrangement(){
 const state={travel:0,spin:0,age:0,cards:[],guides:null,cardHeight:0};
 const gridOffset=(world,browse)=>{
  const rows=Math.ceil(state.cards.length/gridColumns(world.viewport)),step=state.cardHeight+SPIRAL_DEFAULTS.gap,span=(rows-1)/2*step,edge=world.viewport.height*.28;
  return (edge-span)+(2*span-2*edge)*browse;
 };
 const place=(world,card,phases,intro,step)=>{
  // A hovered card brakes on its track (held while the rest keeps drifting); cards never turn.
  card.hover+=((world.hovered===card?1:0)-card.hover)*HOVER_EASE;card.hold=(card.hold||0)+step*card.hover;
  const spiral=spiralPose(card.slot,state.travel+phases.scrub-card.hold,state.spin,world.viewport),grid=gridPose(card.index,state.cards.length,world.viewport,gridOffset(world,phases.browse),state.cardHeight);
  const morph=cardMorph(phases.morph,card.index,state.cards.length),pose=blendPose({...spiral,alpha:spiral.alpha*revealAlpha(spiral.depth,intro.front)},grid,morph);
  card.mesh.position.set(pose.x,pose.y,pose.z+card.hover*30);card.mesh.rotation.set(0,0,pose.rotation);
  world.setSize(card,pose.scale*(1+(HOVER_SCALE-1)*card.hover));
  const uniforms=card.material.uniforms;uniforms.uAlpha.value=pose.alpha;
  uniforms.uBlur.value=morph*Math.max(0,smooth(.35,1,pose.depth)*GRID_BLUR-card.hover);
  card.mesh.renderOrder=Math.round(pose.z+card.hover*100);
 };
 return {
  create(world){
   const count=(world.env.innerWidth||1024)<MOBILE_WIDTH?MOBILE_CARDS:DESKTOP_CARDS,width=SPIRAL_DEFAULTS.gridCardWidth,height=width*CARD_ASPECT;state.cardHeight=height;
   state.cards=Array.from({length:count},(_,index)=>Object.assign(world.addCard(world.items[index%world.items.length],{width,height,radius:RADIUS}),{index,slot:spiralSlot(index,count)}));
   state.guides=createSpiralGuides(THREE,world.scene,themeColor('--ink','#222'));
  },
  bind(world,on){on(world.root,'click',event=>{if(world.open(event.clientX,event.clientY))event.preventDefault();});},
  resize(world){
   world.camera.fov=FOV;world.camera.near=10;world.camera.position.set(0,0,world.viewport.height/2/Math.tan(THREE.MathUtils.degToRad(FOV/2)));
   state.guides.resize(world.viewport);
  },
  update(world,dt){
   const phases=spiralPhases(sectionProgress(world.root.getBoundingClientRect(),world.env.innerHeight||world.viewport.height)),still=world.reduced();
   state.age+=dt;const intro=still?{speedFactor:1,front:Infinity}:introState(state.age),step=dt*phases.speed*intro.speedFactor;
   if(!still){state.travel+=step;state.spin+=dt*SPIRAL_DEFAULTS.spinSpeed;}
   for(const card of state.cards)place(world,card,phases,intro,step);
   state.guides.update(state.spin,1-phases.morph);
   world.stage.style.cursor=world.hovered?.item.projectId?'pointer':'';
  },
  dispose(){state.guides?.dispose();}
 };
}
