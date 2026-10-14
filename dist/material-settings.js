export const materialSettings={stretch:55,lag:65,stiffness:45,damping:70,reflections:10,glow:25,overshoot:60,ripple:65,motionBlur:55};
export const imageEffectDefaults=Object.freeze({ripple:false,blur:true});
export const imageEffects={...imageEffectDefaults};
export class EdgeSpring {
 constructor(){this.position=0;this.velocity=0;}
 step(target,stiffness,damping,dt=1){const step=Math.min(1.5,dt);this.velocity+=(target-this.position)*stiffness*step;this.velocity*=Math.pow(damping,step);this.position+=this.velocity*step;return this.position;}
}
export function edgeTargets(speed,settings){const amount=Math.max(-90,Math.min(90,speed*settings.stretch*.5));return amount>=0?[-amount*(.35+settings.lag*.012),amount]:[amount,-amount*(.35+settings.lag*.012)];}

export function springParameters(settings){return {k:.055+settings.stiffness*.0014,damper:Math.min(.94,.92-settings.damping*.002+settings.overshoot*.0006)};}

// Signed screen-space exposure: sampling along travel leaves a trail behind it.
export function motionTrail(vx,vy,amount){const speed=Math.hypot(vx,vy);if(speed<.001)return {x:0,y:0};const length=Math.min(24,speed*12)*Math.max(0,Math.min(100,amount))/100;return {x:vx/speed*length,y:vy/speed*length};}
export function easeMaterial(value,target,dt=1){return value+(target-value)*(1-Math.pow(.82,Math.min(1.5,Math.max(.3,dt))));}
