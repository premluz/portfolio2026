const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const px=value=>Number.isFinite(parseFloat(value))?parseFloat(value):0;

// Use the viewing angle for the gradual metallic edge reveal. Physical side
// faces below retain thickness even when the front plane is edge-on.
// The screen remains at z=0; the clockwise perimeter has outward normals,
// and its side walls extend backwards to z=-depth.
export function extrusionOffset(angle,depth=8,axis='horizontal',reduced=false){
 const a=clamp(Number(angle)||0,-72,72),amount=reduced?0:clamp(depth,0,12),shift=Math.tan(a*Math.PI/180)*amount;
 const t=reduced?0:clamp(Math.abs(a)/14,0,1);
 return {x:axis==='vertical'?0:(-shift||0),y:axis==='vertical'?(shift||0):0,opacity:t*t*(3-2*t)};
}
export function localGalleryBounds(node,plane){
 let left=0,top=0,parent=node?.offsetParent;
 while(parent&&parent!==plane){left+=parent.offsetLeft||0;top+=parent.offsetTop||0;parent=parent.offsetParent;}
 return {left:left+(node?.offsetLeft||0),top:top+(node?.offsetTop||0)};
}
export function extrusionFaces(width,height,radius,depth=8){
 const w=Math.max(1,width),h=Math.max(1,height),r=clamp(radius,0,Math.min(w,h)/2),faces=[];
 const edge=(x1,y1,x2,y2)=>{const length=Math.hypot(x2-x1,y2-y1);if(length>.01)faces.push({x:x1,y:y1,width:length,height:depth,turn:Math.atan2(y2-y1,x2-x1)*180/Math.PI});};
 edge(r,0,w-r,0);edge(w,r,w,h-r);edge(w-r,h,r,h);edge(0,h-r,0,r);
 if(r)for(const [cx,cy,start] of [[w-r,r,-Math.PI/2],[w-r,h-r,0],[r,h-r,Math.PI/2],[r,r,Math.PI]])for(let i=0;i<8;i++){const a=start+i*Math.PI/16,b=a+Math.PI/16;edge(cx+r*Math.cos(a),cy+r*Math.sin(a),cx+r*Math.cos(b),cy+r*Math.sin(b));}
 return faces;
}

export class GalleryExtrusion{
 constructor(item,onMeasure=()=>{}){
  this.item=item;this.onMeasure=onMeasure;this.plane=item.firstElementChild;this.image=this.plane?.querySelector?.('.visual img');
  // Information-only cards retain their existing flat rendering.
  if(this.image?.tagName!=='IMG')return;
  this.document=item.ownerDocument;this.card=this.image.closest('.project-card');
  this.el=this.document.createElement('span');this.el.className='spatial-gallery-extrusion';this.el.setAttribute('aria-hidden','true');
  this.layers=[];
  this.plane.append(this.el);this.onChange=()=>this.schedule();this.image.addEventListener('load',this.onChange);
  this.observer=new ResizeObserver(this.onChange);this.observer.observe(this.plane);
  this.mutations=new MutationObserver(this.onChange);this.mutations.observe(this.image,{attributes:true,attributeFilter:['style']});
  this.mutations.observe(this.document.body,{attributes:true,attributeFilter:['class']});
  this.measure();
 }
 measure(){
  if(!this.el||this.dead)return;
  const bare=this.document.body.classList.contains('card-background-hidden')||!this.card;
  const fitted=this.image.parentElement?.querySelector?.(':scope > .image-edge')||this.image;
  const node=bare?fitted:this.card,position=localGalleryBounds(node,this.plane);
  const width=bare?px(node.style.width):node.offsetWidth,height=bare?px(node.style.height):node.offsetHeight;
  if(!width||!height){this.el.hidden=true;return;}
  const nextBounds={...position,width,height},changed=!this.bounds||Object.keys(nextBounds).some(key=>nextBounds[key]!==this.bounds[key]);this.bounds=nextBounds;
  this.el.hidden=false;this.depth=clamp(width/90,4,8);
  const radius=bare?px(node.style.borderRadius):px(getComputedStyle(node).borderTopLeftRadius);
  Object.assign(this.el.style,{left:position.left+'px',top:position.top+'px',width:width+'px',height:height+'px',borderRadius:radius+'px',clipPath:'none',zIndex:'2'});
  const faces=extrusionFaces(width,height,radius,this.depth);
  while(this.layers.length<faces.length){const layer=this.document.createElement('i');this.el.append(layer);this.layers.push(layer);}
  while(this.layers.length>faces.length)this.layers.pop().remove();
  faces.forEach((face,index)=>Object.assign(this.layers[index].style,{left:face.x+'px',top:face.y+'px',width:face.width+'px',height:face.height+'px',transform:`rotateZ(${face.turn}deg) rotateX(90deg) translateY(${-face.height}px)`}));
  this.paint(this.angle||0,this.axis||'horizontal',this.reduced||false,this.fade??1);
  if(changed)this.onMeasure(this.bounds);
 }
 paint(angle,axis='horizontal',reduced=false,fade=1){
  this.angle=angle;this.axis=axis;this.reduced=reduced;if(!this.el)return;
  this.fade=fade;const offset=extrusionOffset(angle,this.depth||8,axis,reduced);this.el.style.opacity='1';
  this.layers.forEach(layer=>layer.style.opacity=String(offset.opacity*fade));
 }
 schedule(){if(this.dead||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.measure();});}
 destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.mutations?.disconnect();this.image?.removeEventListener?.('load',this.onChange);this.el?.remove();}
}
