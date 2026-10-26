import {Matrix4} from './vendor/three/three.module.js';

// Map the plane's local pixels through the captured camera into the overlay's CSS coordinate space.
// Keeping the homogeneous W row preserves perspective, including the tilt of an off-centre card.
export function sphereThumbnailTransform(card,camera,viewport,target){
 card.mesh.updateWorldMatrix(true,false);camera.updateMatrixWorld();
 const screen=new Matrix4().set(
  viewport.width/2,0,0,viewport.left+viewport.width/2-target.left,
  0,-viewport.height/2,0,viewport.top+viewport.height/2-target.top,
  0,0,1,0,
  0,0,0,1
 );
 const local=new Matrix4().set(1/target.width,0,0,-.5,0,-1/target.height,0,.5,0,0,1,0,0,0,0,1);
 const matrix=screen.multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(card.mesh.matrixWorld).multiply(local);
 const normalizer=matrix.elements[15];
 return `matrix3d(${matrix.elements.map(value=>value/normalizer).join(',')})`;
}
