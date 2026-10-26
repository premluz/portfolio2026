import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SPHERE,spherePositions,sphereCoast,sphereVelocity} from '../dist/card-sphere-layout.js';
import {sphereThumbnailTransform} from '../dist/card-sphere-pose.js';
import {CardWorld} from '../dist/card-world.js';
import {PerspectiveCamera,Mesh,PlaneGeometry,Vector3,Vector4,Matrix4} from '../dist/vendor/three/three.module.js';

// Exercise unrelated populations: small portrait collections and dense, mixed project collections.
for(const count of [7,83]){
 const positions=spherePositions(count);
 assert.equal(new Set(positions.map(position=>JSON.stringify(position))).size,count);
 for(const {x,y,z} of positions)assert(Math.abs(Math.hypot(x,y,z)-SPHERE.radius)<1e-8);
 assert(Math.abs(positions.reduce((sum,p)=>sum+p.y,0))<1e-8);
 assert(positions.every(p=>Math.abs(p.y)<SPHERE.radius),'No cards share a pole');
}
const once=sphereCoast(1,.5);let velocity=1,distance=0;
for(let frame=0;frame<30;frame++){const next=sphereCoast(velocity,1/60);distance+=next.distance;velocity=next.velocity;}
assert(Math.abs(velocity-once.velocity)<1e-10);assert(Math.abs(distance-once.distance)<1e-10);
assert.equal(sphereVelocity(100,.001),SPHERE.maxVelocity);
assert.equal(sphereVelocity(-100,.001),-SPHERE.maxVelocity);
assert.equal(sphereCoast(.0001,1).velocity,0);

const previousRequest=globalThis.requestAnimationFrame,previousCancel=globalThis.cancelAnimationFrame;
let moving=false,cancelled=0;
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>cancelled++;
try{
 const world={visible:true,env:{document:{hidden:false}},arrangement:{isMoving:()=>moving},frame:0};
 CardWorld.prototype.schedule.call(world);assert.equal(world.frame,0,'A settled sphere schedules no frames');
 moving=true;CardWorld.prototype.schedule.call(world);assert.equal(world.frame,1,'Input wakes the frame clock');
 moving=false;CardWorld.prototype.schedule.call(world);assert.equal(world.frame,0);assert.equal(cancelled,1);
 world.arrangement={};CardWorld.prototype.schedule.call(world);assert.equal(world.frame,1,'Existing continuous arrangements retain their frame clock');
}finally{globalThis.requestAnimationFrame=previousRequest;globalThis.cancelAnimationFrame=previousCancel;}

// The overlay must match all four projected corners, not just the card's bounding rectangle.
for(const pose of [{x:240,y:-120,z:500,tilt:.6,aspect:1.8},{x:-300,y:200,z:-150,tilt:-.8,aspect:.6}]){
 const camera=new PerspectiveCamera(42,1.6,1,10000);camera.position.z=2800;camera.updateMatrixWorld();
 const mesh=new Mesh(new PlaneGeometry(1,1));mesh.position.set(pose.x,pose.y,pose.z);mesh.rotation.y=pose.tilt;mesh.scale.set(200*pose.aspect,200,1);
 const viewport={left:24,top:40,width:1280,height:800},target={left:320,top:180,width:600*pose.aspect,height:600};
 const css=sphereThumbnailTransform({mesh},camera,viewport,target);
 const matrix=new Matrix4().fromArray(css.slice(9,-1).split(',').map(Number));
 assert.notEqual(matrix.determinant(),0,'The transform stays invertible so the browser interpolates instead of jumping');
 for(const [x,y] of [[0,0],[target.width,0],[0,target.height],[target.width,target.height]]){
  const actual=new Vector4(x,y,0,1).applyMatrix4(matrix);
  const expected=new Vector3(x/target.width-.5,.5-y/target.height,0).applyMatrix4(mesh.matrixWorld).project(camera);
  assert(Math.abs(actual.x/actual.w+target.left-(viewport.left+(expected.x+1)*viewport.width/2))<1e-7);
  assert(Math.abs(actual.y/actual.w+target.top-(viewport.top+(1-expected.y)*viewport.height/2))<1e-7);
 }
 mesh.geometry.dispose();mesh.material.dispose();
}
for(const filename of ['catalog','catalog2']){
 const catalog=JSON.parse(await readFile(new URL(`../content/${filename}.json`,import.meta.url)));
 assert(catalog.documents.some(doc=>doc.id==='about-sphere'&&doc.status==='published'));
 assert(catalog.layouts.find(layout=>layout.id==='home').items.some(item=>item.documentId==='about-sphere'));
}
console.log('Sphere passed: different populations, equal radius, bounded frame-independent inertia, exact projected corners for landscape and portrait cards, and both content sets.');
