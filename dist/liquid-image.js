import {materialSettings,imageEffects} from './material-settings.js';
import {ImageFrame,imageGeometry,imageEdgeGeometry} from './image-frame.js';
const imageInstances=new WeakMap(),liveImages=new Set();
export function configureImageEffects(settings){
 let changed=false;
 for(const key of ['ripple','blur'])if(typeof settings[key]==='boolean'&&settings[key]!==imageEffects[key]){imageEffects[key]=settings[key];changed=true;}
 if(changed)for(const image of liveImages)image.configure();
}
const burstDuration=1400;
export function getLiquidImage(el){return imageInstances.get(el);}
export function getImageMotion(el){const motion=getLiquidImage(el)?.motion;return motion?{...motion}:{x:0,y:0};}
export function pulseImages(root,force=1,options){const visual=root?.querySelector('.visual');if(visual)getLiquidImage(visual)?.pulse(force,options);}

// Only explicit motion drives this renderer; idle screenshots stay native and sharp.
export class LiquidImage {
 constructor(el,strength,options={}){
  this.el=el;this.strength=strength;this.fixedResolution=options.fixedResolution;this.motion={x:0,y:0};
  this.imageFrame=new ImageFrame(el,()=>{if(this.ready){this.resize();this.start();}});
  this.dead=false;imageInstances.set(el,this);liveImages.add(this);this.configure();
 }
 configure(){
  if(this.dead)return;const el=this.el;
  this.disposeRenderer();this.effects={...imageEffects};
  this.rendererFailed=false;
  this.motion={x:0,y:0};this.burstStart=-10000;this.burstForce=0;this.burstOrigin=[.06,.5];
 }
 ensureRenderer(){
  // Screenshots render natively on arrival. Allocate/compile/upload only when
  // their motion first needs an image effect, including after a retained return.
  if(this.dead||this.suspended||this.rendererFailed||!this.effects.ripple&&!this.effects.blur||!this.el.querySelector('img'))return false;
  const image=this.el.querySelector('img');
  if(!image.complete||!image.naturalWidth){
   if(!this.awaitImage){this.awaitImage=()=>{image.removeEventListener('load',this.awaitImage);this.awaitImage=null;if(this.motion.x||this.motion.y||this.rippleState()){this.ensureRenderer();this.start();}};image.addEventListener('load',this.awaitImage);}
   return false;
  }
  if(this.gl)return true;const el=this.el;
  this.canvas=document.createElement('canvas');this.canvas.style.visibility='hidden';
  this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});
  if(!this.gl){this.rendererFailed=true;return false;}
  const gl=this.gl;
  const vert='attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const frag=`precision mediump float;
   varying vec2 uv;
   uniform sampler2D tex;
   ${this.effects.ripple?'uniform vec2 burstOrigin; uniform float age; uniform float burst;':''}
   uniform vec2 fit;
   uniform vec2 imageCenter;
   ${this.effects.blur?'uniform vec2 travel;':''}
   uniform vec2 imageSize;
   uniform float cornerRadius;
   uniform float sourceInset;
   void main(){
    vec2 p=vec2(uv.x,1.-uv.y);
    vec2 q=(p-imageCenter)*fit+.5;
    ${this.effects.ripple?`
    if(burst>0.){
     vec2 delta=p-burstOrigin;
     float rippleDistance=length(delta);
     vec2 direction=delta/(rippleDistance+.001);
     float envelope=(1.-exp(-age*18.))*exp(-age*2.2)*(1.-smoothstep(1.,1.4,age));
     float ring=sin(rippleDistance*32.-age*13.)*exp(-abs(rippleDistance-age*.48)*8.)*envelope*burst;
     q+=direction*ring*.009;
    }
    `:''}
    vec3 color=texture2D(tex,q).rgb;
    ${this.effects.blur?`
    // Keep a short signed trail with 80% of the sharp current image.
    // Three samples replace seven; no colour-channel separation.
    if(dot(travel,travel)>.00000001){
     vec2 exposure=travel*fit*.35;
     color=color*.80
      +texture2D(tex,q+exposure*.5).rgb*.14
      +texture2D(tex,q+exposure).rgb*.06;
    }
    `:''}
    // Keep the full source image visible inside the frame. Pixels outside the
    // contained image remain transparent, so the visual's material shows through.
    vec2 bounds=abs((p-imageCenter)*fit*imageSize)-imageSize*.5+cornerRadius+sourceInset;
    float edge=length(max(bounds,0.))+min(max(bounds.x,bounds.y),0.)-cornerRadius;
    float alpha=1.-smoothstep(-.75,.75,edge);
    gl_FragColor=vec4(color,alpha);
   }`;
  const compile=(type,src)=>{const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  try{
   this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vert));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,frag));gl.linkProgram(this.program);
   if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
   gl.useProgram(this.program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const loc=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
   this.uniforms=Object.fromEntries(['fit','imageCenter','imageSize','cornerRadius','sourceInset',...(this.effects.ripple?['burstOrigin','age','burst']:[]),...(this.effects.blur?['travel']:[])].map(k=>[k,gl.getUniformLocation(this.program,k)]));
   this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   const img=el.querySelector('img');
   const load=this.loadImage=()=>{if(this.dead)return;gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);this.ratio=img.naturalWidth/img.naturalHeight;el.append(this.canvas);this.ready=true;this.resize();if(this.burstForce||this.motion.x||this.motion.y)this.start();};
   if(img.complete&&img.naturalWidth)load();else img.addEventListener('load',load,{once:true});
  }catch(e){console.warn('Liquid image fallback',e);this.disposeRenderer();this.rendererFailed=true;}
  return !!this.gl;
 }
 setMotion(x=0,y=0){
  if(this.dead||this.suspended||!this.effects.blur)return;
  // The motion driver smooths signed velocity, including through reversals.
  if(Math.abs(x)<.015)x=0;if(Math.abs(y)<.015)y=0;
  if(this.motion.x===x&&this.motion.y===y)return;
  this.motion={x,y};if(x||y)this.ensureRenderer();this.start();
 }
 rippleState(now=performance.now()){return !this.dead&&this.effects.ripple&&this.burstForce>0&&now-this.burstStart<burstDuration?{start:this.burstStart,force:this.burstForce,origin:[...this.burstOrigin]}:null;}
 resumeRipple(state){
  if(this.dead||!this.effects.ripple||!state||state.force<=0||performance.now()-state.start>=burstDuration||!this.ensureRenderer())return false;
  this.burstStart=state.start;this.burstForce=state.force;this.burstOrigin=[...state.origin];
  // Draw the same wave phase before revealing the receiving image.
  if(this.ready)this.draw(performance.now());this.start();return true;
 }
 pulse(force=1,{onlyIfIdle=false}={}){if(this.dead||this.suspended||!this.effects.ripple||(onlyIfIdle&&this.rippleState()))return;this.burstStart=performance.now();this.burstForce=force*materialSettings.ripple/100*1.8;this.burstOrigin=[.06,.5];if(this.burstForce>0){this.ensureRenderer();this.start();}}
 start(){if(!this.raf&&this.ready&&!this.dead)this.raf=requestAnimationFrame(t=>this.frame(t));}
 frame(t){
  this.raf=0;if(this.dead)return;
  const bursting=(t-this.burstStart)<burstDuration&&this.burstForce>0;
  this.draw(t);
  if(bursting)this.start();
 }
 resize(){
  if(!this.canvas||!this.gl)return;
  const dpr=Math.min(devicePixelRatio,1.25);this.renderW=this.el.clientWidth;this.renderH=this.el.clientHeight;
  const w=Math.max(1,Math.round((this.fixedResolution?.[0]||this.renderW)*dpr)),h=Math.max(1,Math.round((this.fixedResolution?.[1]||this.renderH)*dpr));
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}
 }
 draw(t){
  const gl=this.gl;if(!this.ready||this.dead)return;
  const bursting=(t-this.burstStart)<burstDuration&&this.burstForce>0;
  if(!bursting&&!this.motion.x&&!this.motion.y){
   this.el.classList.remove('liquid-image-ready');this.canvas.style.visibility='hidden';return;
  }
  gl.useProgram(this.program);
  // UVs span more than the texture on the letterboxed axis. Scaling them
  // below one zooms into the texture and squashes it into the whole frame.
  const bounds=imageGeometry(this.renderW,this.renderH,this.ratio,this.imageFrame?.radius,this.imageFrame?.padding,this.imageFrame?.sourceCorners,1,this.imageFrame?.maxWidth||Infinity,this.imageFrame?.maxHeight||Infinity,this.imageFrame?.align||'center',this.imageFrame?.blockAlign||'center');
  gl.uniform2f(this.uniforms.fit,Math.max(1,this.renderW/bounds.width),Math.max(1,this.renderH/bounds.height));
  gl.uniform2f(this.uniforms.imageCenter,(bounds.left+bounds.width/2)/Math.max(1,this.renderW),(bounds.top+bounds.height/2)/Math.max(1,this.renderH));
  gl.uniform2f(this.uniforms.imageSize,bounds.width,bounds.height);gl.uniform1f(this.uniforms.cornerRadius,bounds.radius);
  const visible=imageEdgeGeometry(bounds,this.imageFrame?.sourceInset,this.imageFrame?.sourceCorners?.width||this.imageFrame?.img?.naturalWidth);
  gl.uniform1f(this.uniforms.sourceInset,visible.inset);
  if(this.effects.blur)gl.uniform2f(this.uniforms.travel,this.motion.x/Math.max(1,this.renderW),this.motion.y/Math.max(1,this.renderH));
  if(this.effects.ripple){gl.uniform2fv(this.uniforms.burstOrigin,this.burstOrigin);gl.uniform1f(this.uniforms.age,Math.min(burstDuration/1000,Math.max(0,(t-this.burstStart)/1000)));gl.uniform1f(this.uniforms.burst,(t-this.burstStart)<burstDuration?this.burstForce:0);}
  gl.drawArrays(gl.TRIANGLES,0,6);
  // Reveal only after a fresh draw. Native and canvas share the same geometry.
  this.canvas.style.visibility='';this.el.classList.add('liquid-image-ready');
 }
 disposeRenderer(){
  cancelAnimationFrame(this.raf);this.raf=0;this.ready=false;
  this.el.querySelector('img')?.removeEventListener('load',this.loadImage);
  if(this.awaitImage){this.el.querySelector('img')?.removeEventListener('load',this.awaitImage);this.awaitImage=null;}
  this.el.classList.remove('liquid-image-ready');this.canvas?.remove();
  this.gl?.getExtension('WEBGL_lose_context')?.loseContext();this.gl=null;this.canvas=null;
 }
 // Hidden retained pages keep their native image/frame geometry, but release
 // GPU contexts and animation work until their next shared-card return.
 suspend(){if(this.dead||this.suspended)return;this.suspended=true;this.disposeRenderer();}
 resume(){if(this.dead||!this.suspended)return;this.suspended=false;this.imageFrame.resize();this.configure();}
 destroy(){this.dead=true;this.disposeRenderer();this.imageFrame?.destroy();liveImages.delete(this);if(getLiquidImage(this.el)===this)imageInstances.delete(this.el);}
}
