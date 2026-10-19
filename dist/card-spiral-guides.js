import {SPIRAL_DEFAULTS} from './card-spiral-layout.js';

// The thin tracks behind the cards: concentric circles plus two long spiral strokes, turning with the
// field and fading out as it unwinds into the grid.
const CIRCLES=[.3,.55,.82],SPIRAL_ARMS=[0,3],SEGMENTS=180,OPACITY=.12,SPIRAL_OPACITY=.3;

export function createSpiralGuides(THREE,scene,color){
 const group=new THREE.Group(),material=new THREE.LineBasicMaterial({color,transparent:true,opacity:OPACITY,depthWrite:false});
 group.renderOrder=-1000;scene.add(group);
 const build=reach=>{
  for(const child of [...group.children]){child.geometry.dispose();group.remove(child);}
  group.userData.strokes?.dispose();
  for(const fraction of CIRCLES){const points=Array.from({length:SEGMENTS+1},(_,i)=>{const a=i/SEGMENTS*Math.PI*2;return new THREE.Vector3(Math.cos(a)*reach*fraction,Math.sin(a)*reach*fraction,-1);});group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material));}
  const strokes=new THREE.LineBasicMaterial({color,transparent:true,opacity:SPIRAL_OPACITY,depthWrite:false});group.userData.strokes=strokes;
  for(const arm of SPIRAL_ARMS){const points=Array.from({length:SEGMENTS+1},(_,i)=>{const u=i/SEGMENTS,theta=u*SPIRAL_DEFAULTS.turns*Math.PI*2,r=(SPIRAL_DEFAULTS.birth+(1-SPIRAL_DEFAULTS.birth)*u)*reach,a=theta+arm*Math.PI*2/SPIRAL_DEFAULTS.arms;return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,-1);});group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),strokes));}
 };
 return {
  resize(viewport){build(.7*Math.hypot(viewport.width,viewport.height)/2);},
  update(spin,visibility){group.rotation.z=spin;material.opacity=OPACITY*visibility;if(group.userData.strokes)group.userData.strokes.opacity=SPIRAL_OPACITY*visibility;group.visible=visibility>.01;},
  dispose(){for(const child of group.children)child.geometry.dispose();material.dispose();group.userData.strokes?.dispose();scene.remove(group);}
 };
}
