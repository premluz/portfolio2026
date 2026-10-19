import {INFINITE_DEFAULTS as O,chunkOffsets,chunkCards,chunkOf,cardOpacity,stepFlight,lerp} from './card-infinite-chunks.js';

// Infinite arrangement of the card world: an endless 3D space of cards to fly through. Drag pans with
// inertia, the wheel or a pinch flies forward and back, WASD/arrows and Q/E move when the stage is
// focused, the pointer adds a slight parallax drift, and a click (not a drag) opens a project card.
const STEP=1/60,CLICK_TOLERANCE=6,CHUNK_UPDATE_MS=100,RADIUS_RATIO=.05,START_ASPECT=1.4;
const KEYS={w:['keyZ',-1],s:['keyZ',1],arrowup:['keyZ',-1],arrowdown:['keyZ',1],a:['keyX',-1],d:['keyX',1],arrowleft:['keyX',-1],arrowright:['keyX',1],q:['keyY',-1],e:['keyY',1]};
const OFFSETS=chunkOffsets();

export function createInfiniteArrangement(){
 const zero=()=>({x:0,y:0,z:0});
 const state={flight:{position:{x:0,y:0,z:O.cameraZ},velocity:zero(),target:zero(),wheel:0},drift:{x:0,y:0},mouse:{x:0,y:0},drag:{x:0,y:0},keys:new Map(),pointers:new Map(),pinch:0,chunks:new Map(),chunkKey:'',chunkTime:0,accumulator:0};

 const syncChunks=(world,now,force=false)=>{
  const centre=chunkOf(state.flight.position),key=`${centre.cx},${centre.cy},${centre.cz}`;
  if(!force&&(key===state.chunkKey||now-state.chunkTime<CHUNK_UPDATE_MS))return;
  state.chunkKey=key;state.chunkTime=now;const wanted=new Set();
  for(const {dx,dy,dz} of OFFSETS){
   const chunk={cx:centre.cx+dx,cy:centre.cy+dy,cz:centre.cz+dz},id=`${chunk.cx},${chunk.cy},${chunk.cz}`;wanted.add(id);
   if(state.chunks.has(id))continue;
   const cards=chunkCards(chunk.cx,chunk.cy,chunk.cz,world.items.length).map(plan=>{
    const card=world.addCard(world.items[plan.item],{width:plan.height*START_ASPECT,height:plan.height,radius:plan.height*RADIUS_RATIO,fit:'natural'});
    card.mesh.position.set(plan.x,plan.y,plan.z);card.plan=plan;card.chunk=chunk;card.opacity=0;card.mesh.visible=false;return card;
   });
   state.chunks.set(id,cards);
  }
  for(const [id,cards] of state.chunks)if(!wanted.has(id)){for(const card of cards)world.removeCard(card);state.chunks.delete(id);}
 };

 const fly=world=>{
  const input={dragX:state.drag.x,dragY:state.drag.y,keyX:0,keyY:0,keyZ:0};state.drag={x:0,y:0};
  for(const [axis,sign] of state.keys.values())input[axis]+=sign;
  state.flight=stepFlight(state.flight,input);
  const still=world.reduced()||world.dragging;
  if(!still){state.drift.x=lerp(state.drift.x,state.mouse.x*O.driftAmount,O.driftLerp);state.drift.y=lerp(state.drift.y,state.mouse.y*O.driftAmount,O.driftLerp);}
 };

 return {
  create(world){world.camera.fov=O.fov;world.camera.near=1;world.camera.far=500;syncChunks(world,0,true);},
  resize(){},
  bind(world,on){
   const stage=world.stage;stage.tabIndex=0;
   on(stage,'pointerdown',event=>{state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY});stage.setPointerCapture?.(event.pointerId);world.dragging=true;});
   on(stage,'pointermove',event=>{
    const rect=stage.getBoundingClientRect();state.mouse={x:(event.clientX-rect.left)/rect.width*2-1,y:-((event.clientY-rect.top)/rect.height)*2+1};
    const pointer=state.pointers.get(event.pointerId);if(!pointer)return;
    if(state.pointers.size===2){const [a,b]=[...state.pointers.values()],before=Math.hypot(a.x-b.x,a.y-b.y);pointer.x=event.clientX;pointer.y=event.clientY;const [c,d]=[...state.pointers.values()];state.flight.wheel+=(before-Math.hypot(c.x-d.x,c.y-d.y))*O.wheelSpeed;return;}
    state.drag.x+=event.clientX-pointer.x;state.drag.y+=event.clientY-pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;
   });
   const release=event=>{
    const pointer=state.pointers.get(event.pointerId);state.pointers.delete(event.pointerId);world.dragging=state.pointers.size>0;
    if(pointer&&event.type==='pointerup'&&Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)<CLICK_TOLERANCE)world.open(event.clientX,event.clientY);
   };
   on(stage,'pointerup',release);on(stage,'pointercancel',release);
   on(stage,'pointerleave',()=>{state.mouse={x:0,y:0};});
   on(stage,'wheel',event=>{event.preventDefault();state.flight.wheel+=event.deltaY*O.wheelSpeed;},{passive:false});
   on(stage,'keydown',event=>{const key=KEYS[event.key.toLowerCase()];if(key){event.preventDefault();state.keys.set(event.key.toLowerCase(),key);}});
   on(stage,'keyup',event=>state.keys.delete(event.key.toLowerCase()));
   on(stage,'blur',()=>state.keys.clear());
  },
  update(world,dt){
   state.accumulator=Math.min(state.accumulator+dt,STEP*4);
   while(state.accumulator>=STEP){fly(world);state.accumulator-=STEP;}
   const {position}=state.flight;world.camera.position.set(position.x+state.drift.x,position.y+state.drift.y,position.z);
   syncChunks(world,performance.now());
   const centre=chunkOf(position);
   for(const cards of state.chunks.values())for(const card of cards){
    const target=cardOpacity(card.plan,card.chunk,position,centre);
    card.opacity=target<.01&&card.opacity<.01?0:lerp(card.opacity,target,O.opacityLerp);
    card.material.uniforms.uAlpha.value=card.material.uniforms.uReady.value?card.opacity:0;card.mesh.visible=card.opacity>.01;
    world.setSize(card,1);
   }
   world.stage.style.cursor=world.dragging?'grabbing':world.hovered?.item.projectId?'pointer':'grab';
  },
  dispose(world){for(const cards of state.chunks.values())for(const card of cards)world.removeCard(card);state.chunks.clear();}
 };
}
