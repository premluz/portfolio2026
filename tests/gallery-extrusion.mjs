import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GalleryExtrusion,extrusionOffset,localGalleryBounds,extrusionFaces} from '../dist/gallery-extrusion.js';

assert.deepEqual(extrusionOffset(0),{x:0,y:0,opacity:0});
const right=extrusionOffset(45,8),left=extrusionOffset(-45,8);
assert(Math.abs(right.x+8)<1e-8);assert.equal(right.y,0);assert.equal(right.opacity,1);assert.equal(left.x,-right.x);
assert(Math.abs(extrusionOffset(45,8,'vertical').y-8)<1e-8);
assert.deepEqual(extrusionOffset(45,8,'horizontal',true),{x:0,y:0,opacity:0});
assert(extrusionOffset(.1).opacity<.001,'Thickness blends smoothly away as a card faces front');
for(let angle=-100;angle<=100;angle++){const offset=extrusionOffset(angle,100);assert(Math.abs(offset.x)<38&&Number.isFinite(offset.x));}

let id=0,bare=true;const frames=new Map(),resize=[],mutations=[];
globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
const flush=()=>{const pending=[...frames];frames.clear();for(const [,fn] of pending)fn();assert.equal(frames.size,0,'No idle material loop');};
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;resize.push(this);}observe(){}disconnect(){this.disconnected=true;}};
globalThis.MutationObserver=class{constructor(fn){this.fn=fn;this.observed=[];mutations.push(this);}observe(node){this.observed.push(node);}disconnect(){this.disconnected=true;}};
globalThis.getComputedStyle=()=>({borderTopLeftRadius:'28px'});
const node=()=>({children:[],style:{setProperty(k,v){this[k]=v;}},listeners:new Map(),append(child){this.children.push(child);child.parentElement=this;},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.listeners.set(k,fn);},removeEventListener(k){this.listeners.delete(k);},remove(){this.removed=true;}});
const body={classList:{contains:()=>bare}},doc={body,createElement:node};
const plane=node(),card=node(),visual=node(),img=node(),edge=node();
Object.assign(card,{offsetLeft:0,offsetTop:0,offsetWidth:700,offsetHeight:500,offsetParent:plane});
Object.assign(visual,{offsetLeft:16,offsetTop:16,offsetParent:card});
Object.assign(img,{tagName:'IMG',offsetLeft:5,offsetTop:30,offsetParent:visual,parentElement:visual,closest:()=>card});
Object.assign(edge,{offsetLeft:6,offsetTop:31,offsetParent:visual,style:{width:'280px',height:'430px',borderRadius:'14px'}});
visual.querySelector=()=>edge;plane.querySelector=()=>img;
const item={firstElementChild:plane,ownerDocument:doc};
assert.deepEqual(localGalleryBounds(edge,plane),{left:22,top:47});
const measurements=[];const extrusion=new GalleryExtrusion(item,bounds=>measurements.push({...bounds}));
assert.deepEqual(extrusion.bounds,{left:22,top:47,width:280,height:430},'Carousel spacing receives the actual fitted image bounds');assert.equal(measurements.length,1);
assert.equal(extrusion.layers.length,36);assert.equal(plane.children.length,1,'Only a material layer is added; images are not cloned');
assert.equal(extrusion.el['aria-hidden'],'true');assert.equal(extrusion.el.style.left,'22px');assert.equal(extrusion.el.style.width,'280px');assert.equal(extrusion.el.style.borderRadius,'14px');assert(extrusion.layers.every(layer=>layer.style.opacity==='0'));
extrusion.paint(40);assert(extrusion.layers.every(layer=>layer.style.opacity==='1'));assert(extrusion.layers[0].style.transform.includes('rotateX(90deg)'));
assert(extrusion.layers.every(layer=>layer.style.transform.endsWith(`translateY(-${extrusion.depth}px)`)),'Walls extend behind the screen, rather than standing in front of it');
bare=false;mutations[0].fn();flush();assert.equal(extrusion.el.style.width,'700px');assert.equal(extrusion.el.style.borderRadius,'28px','Visible card backing uses the outer card shape');
bare=true;edge.style.width='320px';edge.style.borderRadius='9px';resize[0].fn();flush();assert.equal(extrusion.el.style.width,'320px');assert.equal(extrusion.el.style.borderRadius,'9px','Image size and rounding settings stay in sync');
assert.equal(measurements.length,3,'Backing and fitted-size changes refresh spacing once');assert.equal(extrusion.bounds.width,320);extrusion.measure();assert.equal(measurements.length,3,'Unchanged geometry does not schedule another layout');
extrusion.paint(35,'horizontal',true);assert(extrusion.layers.every(layer=>layer.style.opacity==='0'));
extrusion.schedule();extrusion.destroy();assert.equal(frames.size,0);assert.equal(img.listeners.size,0);assert(resize[0].disconnected&&mutations[0].disconnected&&extrusion.el.removed);mutations[0].fn();assert.equal(frames.size,0,'Stale callbacks cannot revive a disposed card');
console.log('Gallery extrusion passed: physical edge-on thickness, smooth face-on fade, bounded offsets, exact fitted corners, rounded side mesh, shared images, background variants, responsive sizing, reduced motion and disposal.');

const faces=extrusionFaces(300,500,16,8);assert.equal(faces.length,36);assert(faces.every(face=>face.height===8));assert.equal(faces[1].turn,90,'The vertical side face is perpendicular to the front');assert.equal(faces[1].height,8,'At a 90 degree view the side retains its physical thickness');
const rad=value=>value*Math.PI/180;
// The clockwise edge tangent produces outward normal (sin(turn), -cos(turn), 0).
// After the carousel's Y rotation, only the wall with a positive Z normal faces the viewer.
const facing=(face,angle)=>-Math.sin(rad(face.turn))*Math.sin(rad(angle));
for(const angle of [-90,-45,-10,10,45,90]){
 const rightFacing=facing(faces[1],angle)>0,leftFacing=facing(faces[3],angle)>0;
 assert.notEqual(rightFacing,leftFacing,'Opposing walls cannot both face the camera');
 assert.equal(rightFacing,angle<0,'Left carousel cards expose their right wall');
 assert.equal(leftFacing,angle>0,'Right carousel cards expose their left wall');
 const frontX=300*Math.cos(rad(angle)),backX=frontX-8*Math.sin(rad(angle));
 assert.equal(backX>frontX,angle<0,'Depth projects behind the screen on the correct side');
}
const css=await readFile(new URL('../dist/card-gallery.css',import.meta.url),'utf8');
assert.match(css,/\.spatial-gallery-extrusion>i\{[^}]*backface-visibility:hidden/,'Inward faces must actually be culled in the renderer');
