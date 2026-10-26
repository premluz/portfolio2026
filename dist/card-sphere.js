import {Vector3,Euler,MathUtils} from './vendor/three/three.module.js';
import {SPHERE as O,spherePositions,sphereCoast,sphereVelocity} from './card-sphere-layout.js';
import {SphereViewer} from './card-sphere-viewer.js';

const FORWARD=new Vector3(0,0,1);
const KEYS={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};

const rotate=(state,x,y)=>{state.rotation.x+=x;state.rotation.y+=y;};
const stop=state=>{state.velocity={x:0,y:0};};
function bindPointer(state,world,on){
  const stage=world.stage;
  on(stage,'pointerdown',event=>{
   if(state.viewer.selected||event.button!==0||state.pointer)return;
   stop(state);stage.focus({preventScroll:true});stage.setPointerCapture(event.pointerId);
   state.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,time:event.timeStamp,moved:false};
  });
  on(stage,'pointermove',event=>{
   const pointer=state.pointer;if(!pointer||pointer.id!==event.pointerId)return;
   const x=(event.clientY-pointer.y)*O.dragRadians,y=(event.clientX-pointer.x)*O.dragRadians;
   pointer.moved||=Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>O.clickTolerance;
   if(pointer.moved){rotate(state,x,y);state.velocity={x:sphereVelocity(x,(event.timeStamp-pointer.time)/1000),y:sphereVelocity(y,(event.timeStamp-pointer.time)/1000)};}
   Object.assign(pointer,{x:event.clientX,y:event.clientY,time:event.timeStamp});world.dragging=pointer.moved;
  });
  const release=event=>{
   const pointer=state.pointer;if(!pointer||pointer.id!==event.pointerId)return;
   state.pointer=null;world.dragging=false;
   if(event.type!=='pointerup'||world.reduced()||event.timeStamp-pointer.time>O.releasePauseMs)stop(state);
   if(event.type==='pointerup'&&!pointer.moved){const card=world.pick(event.clientX,event.clientY);if(card){stop(state);state.viewer.open(card);}}
   world.invalidate();
  };
  on(stage,'pointerup',release);on(stage,'pointercancel',release);on(stage,'lostpointercapture',release);
 }
function bindNavigation(state,world,on){
  on(world.stage,'wheel',event=>{
   if(state.viewer.selected)return;event.preventDefault();stop(state);
   const unit=event.deltaMode===1?O.wheelLinePixels:event.deltaMode===2?world.viewport.height:1;
   const x=MathUtils.clamp(event.deltaY*unit*O.wheelRadians,-O.keyRadians,O.keyRadians),y=MathUtils.clamp(event.deltaX*unit*O.wheelRadians,-O.keyRadians,O.keyRadians);
   rotate(state,x,y);if(!world.reduced())state.velocity={x:sphereVelocity(x,O.frameSeconds),y:sphereVelocity(y,O.frameSeconds)};
   world.invalidate();
  },{passive:false});
  on(world.stage,'keydown',event=>{
   const direction=KEYS[event.key];if(!direction||state.viewer.selected)return;
   event.preventDefault();event.stopPropagation();stop(state);rotate(state,direction[0]*O.keyRadians,direction[1]*O.keyRadians);
   world.invalidate();
  });
  on(world.env,'blur',()=>{stop(state);state.pointer=null;world.dragging=false;});
 }
export function createSphereArrangement(){
 const state={rotation:new Euler(0,0,0,'YXZ'),velocity:{x:0,y:0},pointer:null,viewer:null};
 return {
  isMoving(){return !state.viewer?.selected&&(state.velocity.x!==0||state.velocity.y!==0);},
  create(world){
   state.viewer=new SphereViewer(world);
   spherePositions(Math.max(O.count,world.items.length)).forEach((home,index)=>{
    const card=world.addCard(world.items[index%world.items.length],{width:O.cardHeight*O.initialAspect,height:O.cardHeight,fit:'natural'});
    card.home=new Vector3(home.x,home.y,home.z);
   });
  },
  resize(world){
   if(state.viewer.selected)state.viewer.destroy();
   world.camera.fov=O.fov;world.camera.near=1;world.camera.far=O.radius*O.farRadius;
   world.camera.position.set(0,0,O.radius*O.cameraDistance*Math.max(1,1/world.camera.aspect));
  },
  bind(world,on){world.stage.tabIndex=0;world.stage.setAttribute('aria-label','Drag to rotate the sphere. Arrow keys rotate; Tab reaches project links.');bindPointer(state,world,on);bindNavigation(state,world,on);},
  update(world,dt){
   if(state.viewer.selected)return;
   if(!state.pointer&&!world.reduced()){
    const x=sphereCoast(state.velocity.x,dt),y=sphereCoast(state.velocity.y,dt);rotate(state,x.distance,y.distance);state.velocity={x:x.velocity,y:y.velocity};
   }else if(world.reduced())stop(state);
   for(const card of world.cards){
    card.mesh.position.copy(card.home).applyEuler(state.rotation);
    const normal=card.mesh.position.clone().normalize(),toward=world.camera.position.clone().sub(card.mesh.position).normalize();
    const facing=normal.dot(toward),alpha=MathUtils.smoothstep(facing,0,O.edgeFade);
    card.mesh.quaternion.setFromUnitVectors(FORWARD,normal);world.setSize(card);
    card.mesh.visible=alpha>0;card.material.uniforms.uAlpha.value=alpha;
   }
   world.stage.style.cursor=world.dragging?'grabbing':world.hovered?'pointer':'grab';
  },
  dispose(){state.viewer?.destroy();stop(state);state.pointer=null;}
 };
}
