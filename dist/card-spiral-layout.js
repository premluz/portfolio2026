// Pure layout for the card spiral: where each card sits on the spiral, where it sits in the grid, and
// how scroll moves the field from one to the other. World units are CSS pixels (the camera is placed so
// that z=0 maps one unit to one pixel), so every value here can be checked against the screen.

export const SPIRAL_DEFAULTS=Object.freeze({
 arms:6,turns:1.05,birth:.12,cardHeight:.2,idleSpeed:.012,scrollScrub:.35,spinSpeed:.004,tilt:.32,
 introBurst:3,introSeconds:2.5,revealSeconds:1.6,
 columnsMin:2,gap:28,gridCardWidth:260,
 morphFrom:.18,morphTo:.55,stagger:.18,browseFrom:.55
});

// Cards are small at the centre and grow along the arm, so the arms read as a galaxy, not a pile.
// Like the reference, cards are medium even near the centre and only somewhat larger at the rim.
const SPIRAL_SCALE_MIN=.46,SPIRAL_SCALE_MAX=.74,BIRTH_GROWTH=.1;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
export const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};
const wrap=value=>value-Math.floor(value);

/** Scroll progress through the section (0 at its top, 1 when its end reaches the viewport bottom). */
export function sectionProgress({top,height},viewportHeight){
 const travel=Math.max(1,height-viewportHeight);
 return clamp(-top/travel);
}

/** The scroll phases: spiral speed-up, morph into the grid, then browsing the grid. */
// Scroll is a phase offset on the conveyor (cards advance along their tracks), never a spin of the scene.
export function spiralPhases(progress,options=SPIRAL_DEFAULTS){
 const morph=smooth(options.morphFrom,options.morphTo,progress);
 return {
  speed:options.idleSpeed,
  scrub:options.scrollScrub*Math.min(progress,options.morphTo),
  morph,
  browse:clamp((progress-options.browseFrom)/(1-options.browseFrom))
 };
}

// Each card owns one slot along one arm; slots spread round-robin so arms fill evenly.
export function spiralSlot(index,count,options=SPIRAL_DEFAULTS){
 const arm=index%options.arms,perArm=Math.ceil(count/options.arms),slot=Math.floor(index/options.arms);
 const jitter=((index*.61803398875)%1-.5)*.35/perArm;
 return {arm,base:wrap(slot/perArm+jitter+arm*.5/options.arms)};
}

/** A card on the spiral: position, rotation along the arm, scale and opacity near the ends. */
export function spiralPose(slot,travel,spin,viewport,options=SPIRAL_DEFAULTS){
 const u=wrap(slot.base+travel),reach=.7*Math.hypot(viewport.width,viewport.height)/2;
 const theta=u*options.turns*Math.PI*2,radius=(options.birth+(1-options.birth)*u)*reach;
 const angle=theta+slot.arm*Math.PI*2/options.arms+spin;
 const x=radius*Math.cos(angle),y=radius*Math.sin(angle);
 return {
  x,y,z:0,
  // Cards are always shown upright, as photographs are seen: the spiral moves them, never turns them.
  rotation:0,
  // Born by growing out of the centre at full opacity, so no card is ever a translucent ghost.
  scale:(SPIRAL_SCALE_MIN+(SPIRAL_SCALE_MAX-SPIRAL_SCALE_MIN)*u*u)*smooth(0,BIRTH_GROWTH,u),
  alpha:1-smooth(.9,1,u),
  depth:u
 };
}

/** Intro: a burst of speed that eases to idle, and a reveal wave travelling out from the centre. */
export function introState(seconds,options=SPIRAL_DEFAULTS){
 const t=clamp(seconds/options.introSeconds);
 return {speedFactor:1+(options.introBurst-1)*(1-t)*(1-t),front:seconds/options.revealSeconds};
}
export const revealAlpha=(depth,front)=>smooth(depth-.15,depth+.05,front);

/** The grid: rows of cards on a plane tilted back, scrolled by `offset` pixels. */
export function gridColumns(viewport,options=SPIRAL_DEFAULTS){
 return Math.max(options.columnsMin,Math.floor((viewport.width*.86+options.gap)/(options.gridCardWidth+options.gap)));
}
export function gridPose(index,count,viewport,offset,cardHeight,options=SPIRAL_DEFAULTS){
 const columns=gridColumns(viewport,options),rows=Math.ceil(count/columns);
 const column=index%columns,row=Math.floor(index/columns),stepX=options.gridCardWidth+options.gap,stepY=cardHeight+options.gap;
 const x=(column-(columns-1)/2)*stepX,flatY=(rows-1)/2*stepY-row*stepY+offset;
 return {x,y:flatY*Math.cos(options.tilt),z:-flatY*Math.sin(options.tilt),rotation:0,scale:1,alpha:1,depth:Math.min(1,Math.abs(flatY)/(viewport.height*.6))};
}
export function gridTravel(count,viewport,cardHeight,options=SPIRAL_DEFAULTS){
 const rows=Math.ceil(count/gridColumns(viewport,options));
 return Math.max(0,rows*(cardHeight+options.gap)-viewport.height*.5);
}

// Cards nearer the centre settle first, so the spiral unwinds into the grid from the middle out.
export function cardMorph(morph,index,count,options=SPIRAL_DEFAULTS){
 const delay=options.stagger*(index/Math.max(1,count-1));
 return smooth(delay,delay+1-options.stagger,morph);
}

const lerp=(a,b,t)=>a+(b-a)*t;
// The shortest turn between angles, so a card never spins the long way round while it settles.
const angleLerp=(a,b,t)=>{const d=((b-a)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;return a+d*t;};
export function blendPose(a,b,t){
 return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t),rotation:angleLerp(a.rotation,b.rotation,t),scale:lerp(a.scale,b.scale,t),alpha:lerp(a.alpha,b.alpha,t),depth:lerp(a.depth,b.depth,t)};
}
