// Pure maths for the infinite card space, after edoardolunardi/infinite-canvas (MIT): space is cut into
// cubic chunks, each holding a few cards at seeded positions, so any chunk always looks the same when
// revisited. Only chunks near the camera exist; cards fade with chunk distance and with depth (fog).

export const INFINITE_DEFAULTS=Object.freeze({
 chunkSize:110,cardsPerChunk:5,renderDistance:2,fadeMargin:1,minHeight:12,heightRange:8,
 depthFadeStart:140,depthFadeEnd:260,maxVelocity:3.2,velocityLerp:.16,velocityDecay:.9,
 dragSpeed:.025,wheelSpeed:.006,wheelDecay:.8,keyboardSpeed:.18,driftAmount:8,driftLerp:.12,
 opacityLerp:.18,cameraZ:50,fov:60
});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const lerp=(a,b,t)=>a+(b-a)*t;

// Deterministic per chunk: the same coordinates always give the same cards.
export function hashString(text){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return hash>>>0;}
export function seededRandom(seed){const x=Math.sin(seed*12.9898+78.233)*43758.5453;return x-Math.floor(x);}

export function chunkOffsets(options=INFINITE_DEFAULTS){
 const reach=options.renderDistance+options.fadeMargin,offsets=[];
 for(let dx=-reach;dx<=reach;dx++)for(let dy=-reach;dy<=reach;dy++)for(let dz=-reach;dz<=reach;dz++)offsets.push({dx,dy,dz,dist:Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))});
 return offsets;
}

export function chunkCards(cx,cy,cz,itemCount,options=INFINITE_DEFAULTS){
 const seed=hashString(`${cx},${cy},${cz}`),size=options.chunkSize;
 return Array.from({length:options.cardsPerChunk},(_,i)=>{
  const random=n=>seededRandom(seed+i*1000+n);
  return {id:`${cx},${cy},${cz},${i}`,x:cx*size+random(0)*size,y:cy*size+random(1)*size,z:cz*size+random(2)*size,height:options.minHeight+random(4)*options.heightRange,item:Math.floor(random(5)*1e6)%Math.max(1,itemCount)};
 });
}

export const chunkOf=(position,options=INFINITE_DEFAULTS)=>({cx:Math.floor(position.x/options.chunkSize),cy:Math.floor(position.y/options.chunkSize),cz:Math.floor(position.z/options.chunkSize)});

/** How visible a card is: fades out over the outermost chunk ring and with depth from the camera. */
export function cardOpacity(card,chunk,camera,cameraChunk,options=INFINITE_DEFAULTS){
 const dist=Math.max(Math.abs(chunk.cx-cameraChunk.cx),Math.abs(chunk.cy-cameraChunk.cy),Math.abs(chunk.cz-cameraChunk.cz));
 const depth=Math.abs(card.z-camera.z);
 if(depth>options.depthFadeEnd)return 0;
 const ring=dist<=options.renderDistance?1:Math.max(0,1-(dist-options.renderDistance)/options.fadeMargin);
 const fog=depth<=options.depthFadeStart?1:Math.max(0,1-(depth-options.depthFadeStart)/(options.depthFadeEnd-options.depthFadeStart));
 return Math.min(ring,fog*fog);
}

/** One step of the flight controller: input becomes target velocity, velocity eases toward it, decays. */
export function stepFlight(state,input,options=INFINITE_DEFAULTS){
 const target={...state.target};
 target.x+=input.dragX*options.dragSpeed*-1+input.keyX*options.keyboardSpeed;
 target.y+=input.dragY*options.dragSpeed+input.keyY*options.keyboardSpeed;
 target.z+=state.wheel+input.keyZ*options.keyboardSpeed;
 for(const axis of ['x','y','z'])target[axis]=clamp(target[axis],-options.maxVelocity,options.maxVelocity);
 const velocity={x:lerp(state.velocity.x,target.x,options.velocityLerp),y:lerp(state.velocity.y,target.y,options.velocityLerp),z:lerp(state.velocity.z,target.z,options.velocityLerp)};
 return {
  position:{x:state.position.x+velocity.x,y:state.position.y+velocity.y,z:state.position.z+velocity.z},
  velocity,
  target:{x:target.x*options.velocityDecay,y:target.y*options.velocityDecay,z:target.z*options.velocityDecay},
  wheel:state.wheel*options.wheelDecay
 };
}
