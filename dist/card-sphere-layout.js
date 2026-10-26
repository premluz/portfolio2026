export const SPHERE=Object.freeze({
 radius:1000,count:80,cardHeight:180,initialAspect:1.4,fov:42,cameraDistance:2.8,
 dragRadians:.004,wheelRadians:.0012,keyRadians:.12,maxVelocity:1.2,
 friction:5,stopVelocity:.002,clickTolerance:6,frameSeconds:1/60,releasePauseMs:100,
 wheelLinePixels:16,farRadius:8,edgeFade:.24,
 viewerDuration:560,viewerExit:320
});
const GOLDEN_ANGLE=Math.PI*(3-Math.sqrt(5));

// Equal-area latitude bands keep both poles as open as the equator.
export function spherePositions(count,radius=SPHERE.radius){
 return Array.from({length:count},(_,index)=>{
  const y=1-2*(index+.5)/count,ring=Math.sqrt(1-y*y),angle=index*GOLDEN_ANGLE;
  return {x:radius*ring*Math.cos(angle),y:radius*y,z:radius*ring*Math.sin(angle)};
 });
}

export function sphereCoast(velocity,dt){
 const decay=Math.exp(-SPHERE.friction*dt),next=velocity*decay;
 return {distance:velocity*(1-decay)/SPHERE.friction,velocity:Math.abs(next)<SPHERE.stopVelocity?0:next};
}

export function sphereVelocity(delta,seconds){
 return Math.max(-SPHERE.maxVelocity,Math.min(SPHERE.maxVelocity,delta/Math.max(SPHERE.frameSeconds,seconds)));
}
