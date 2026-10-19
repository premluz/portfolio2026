// Card surface for the spiral: rounded-rectangle mask with a hairline frame, the image cover-fitted,
// a slight chromatic split toward the edges, and a small multi-tap blur used for depth of field.

export const cardVertexShader=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;

export const cardFragmentShader=`
precision highp float;
uniform sampler2D uMap;
uniform vec2 uSize;        // card size in px
uniform vec2 uCover;       // uv scale that cover-fits the image
uniform float uRadius;     // corner radius in px
uniform float uAlpha;
uniform float uBlur;       // 0..1 depth-of-field amount
uniform float uAberration; // 0..1 chromatic split
uniform float uReady;      // 0 until the texture has loaded
uniform vec3 uBase;        // surface colour shown while loading
uniform vec3 uFrame;
uniform float uFrameAlpha; // hairline frame, off by default so cards read like carousel cards
varying vec2 vUv;

vec3 sampleCover(vec2 uv){return texture2D(uMap,(uv-0.5)*uCover+0.5).rgb;}

void main(){
 vec2 d=vUv-0.5;
 vec2 shift=d*dot(d,d)*0.04*uAberration;
 vec3 color=vec3(sampleCover(vUv+shift).r,sampleCover(vUv).g,sampleCover(vUv-shift).b);
 if(uBlur>0.01){
  vec2 r=uBlur*6.0/uSize;vec3 sum=color;
  sum+=sampleCover(vUv+vec2(r.x,0.0));sum+=sampleCover(vUv-vec2(r.x,0.0));
  sum+=sampleCover(vUv+vec2(0.0,r.y));sum+=sampleCover(vUv-vec2(0.0,r.y));
  sum+=sampleCover(vUv+r*0.7);sum+=sampleCover(vUv-r*0.7);
  sum+=sampleCover(vUv+vec2(r.x,-r.y)*0.7);sum+=sampleCover(vUv+vec2(-r.x,r.y)*0.7);
  color=mix(color,sum/9.0,clamp(uBlur*1.4,0.0,1.0));
 }
 color=mix(uBase,color,uReady);
 vec2 q=abs((vUv-0.5)*uSize)-(0.5*uSize-vec2(uRadius));
 float edge=length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0)-uRadius;
 float inside=1.0-smoothstep(-0.75,0.75,edge);
 float frame=1.0-smoothstep(0.5,1.5,abs(edge+1.0));
 color=mix(color,uFrame,frame*uFrameAlpha);
 gl_FragColor=vec4(color,uAlpha*inside);
 if(gl_FragColor.a<0.004)discard;
}
`;

/** Uniform values that cover-fit an image of `imageAspect` into a card of `cardAspect`. */
export function coverScale(cardAspect,imageAspect){
 return cardAspect>imageAspect?[1,imageAspect/cardAspect]:[cardAspect/imageAspect,1];
}
