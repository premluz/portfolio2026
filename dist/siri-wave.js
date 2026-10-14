// Adapted from aaaa-zhen/glsl-playground/siri-wave.html (MIT).
// https://github.com/aaaa-zhen/glsl-playground — attribution in vendor/siri-wave/NOTICE.md.
const fragment=`precision highp float;
uniform vec2 iResolution; uniform float iTime; uniform float iActivity;
const float PI = 3.14159265359;
const float AMPLITUDE   = 0.32;
const float FREQ        = 1.1;
const float ABER_FREQ   = 1.0;
const float SPEED       = 2.4;
const float WAVE_SCALE  = 0.6;
const float ABERRATION  = 2.6;
const float THICKNESS   = 3.0;
const float INTENSITY   = 2.;
const float FALLOFF     = 1.7;
const float EDGE_MASK   = 0.4;
const float EDGE_INSET  = 0.0;
const float BAND_FILL   = 30000.0;
const float BAND_THICK  = 0.08;
const float SOFTNESS    = 2.5;
const float LOW_AMP     = 6.0;
const float LOW_INT     = 1.5;
const float MID_ABER    = 0.8;
const float MID_ABAMP   = 0.05;
const float MID_BAND    = 20.0;
const float MID_SOFT    = 0.4;
const float HIGH_ABER   = 0.5;
const float HIGH_ABAMP  = 0.06;
const float RESOLVED    = 1.0;
const float UNRES_SCALE = 0.14;

vec3 spectral4(int s){
    float x = float(s);
    return clamp(vec3(abs(x-3.0)-1.0, 2.0-abs(x-2.0), 2.0-abs(x-4.0)), 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 R = iResolution.xy;
    float aspect = R.x / R.y;
    vec2 p = (fragCoord + 0.5) * 2.0 / R - 1.0;
    p.x *= aspect;
    float yScreen = p.y;
    p /= max(WAVE_SCALE, 0.1);

    float t   = iTime;
    float low  = clamp(0.45 + 0.45*sin(t*0.8)*sin(t*0.37+1.0), 0.0, 1.0);
    float mid  = clamp(0.40 + 0.40*sin(t*1.7+2.0)*sin(t*0.53), 0.0, 1.0);
    float high = clamp(0.30 + 0.30*sin(t*2.9+4.0)*sin(t*0.71+2.0), 0.0, 1.0);

    float res   = clamp(RESOLVED, 0.0, 1.0);
    float drift = mod(t, 20.0*PI) * SPEED;

    float xN  = p.x / max(aspect, 1.0);
    float env = cos(PI*0.5 * min(abs(0.9*xN), 1.0));
    env *= env;

    float A1    = (AMPLITUDE + 0.01*low*LOW_AMP) * mix(0.25, 1.0, iActivity);
    float A2    = A1 + (mid*MID_ABAMP + high*HIGH_ABAMP) * mix(0.3, 1.0, iActivity);
    float AB    = (ABERRATION + mid*MID_ABER + high*HIGH_ABER)*res;
    float th    = mix(0.1, 0.01*THICKNESS, res);
    float inten = mix(0.1, 0.01*(INTENSITY + low*LOW_INT), res);
    float soft  = 0.01*res*max(0.0, SOFTNESS + mid*MID_SOFT);

    float dUnres = max(length(p) - mix(0.14, UNRES_SCALE, res), 0.0);
    float yMain = A1 * env * res * sin(p.x*FREQ + drift);

    float bandFillTh = max(BAND_THICK, 1e-4);
    float bandAmt    = 1e-4 * BAND_FILL * inten;
    vec3 num = vec3(0.0), den = vec3(0.0);
    for(int s = 0; s < 4; s++){
        vec3 hue = mix(vec3(1.0), spectral4(s), res);
        den += hue;
        float ab = mix(-AB, AB, float(s)/3.0);
        float yL = A2 * env * res * sin(p.x*ABER_FREQ + drift + ab);
        float d   = mix(dUnres, abs(p.y - yL), res);
        float lor = mix(1.0/(1.0 + (0.02*d)*(0.02*d)), 1.0, res);
        float line = inten / (sqrt(d*d + soft*soft) + th);
        float lo = min(yMain, yL), hi = max(yMain, yL);
        float dBand = max(0.0, max(p.y - hi, lo - p.y));
        float band  = bandAmt / (dBand + bandFillTh);
        num += hue * lor * (line + band);
    }
    vec3 col = num / den;

    float dM    = mix(dUnres, abs(p.y - yMain), res);
    float lorM  = mix(1.0/(1.0 + (0.02*dM)*(0.02*dM)), 1.0, res);
    float boost = (1.0 - res) * (14.0*low + 4.0);
    col += 0.5 * inten * (lorM + boost) / (sqrt(dM*dM + soft*soft) + th);

    col = pow(max(col, 0.0), vec3(1.5));
    float emT = clamp((abs(yScreen) - 1.0 + EDGE_INSET) / (-max(EDGE_MASK, 1e-4)), 0.0, 1.0);
    float em  = emT*emT*(3.0 - 2.0*emT);
    float gauss = exp(-pow(xN*FALLOFF, 2.0));
    col *= mix(1.0, em*gauss, res);
    col *= res;
    col = clamp(col, 0.0, 1.0);
    fragColor = vec4(col, max(col.r, max(col.g, col.b)));
}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }`;
export class SiriWave {
 constructor(canvas,{reduced=()=>false}={}){
  this.canvas=canvas;this.reduced=reduced;this.activity=.3;this.level=.3;this.time=0;this.last=0;this.dead=false;
  this.gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,powerPreference:'low-power'});if(!this.gl)throw Error('WebGL unavailable');
  const gl=this.gl,shaders=[];this.shaders=shaders;
  const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Wave shader unavailable');return shader;};
  try{this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}'));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('Wave program unavailable');
   gl.useProgram(this.program);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const attribute=gl.getAttribLocation(this.program,'aPos');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);this.uniforms=Object.fromEntries(['iResolution','iTime','iActivity'].map(key=>[key,gl.getUniformLocation(this.program,key)]));
  }catch(error){this.destroy();throw error;}
  this.visibility=()=>{cancelAnimationFrame(this.frame);this.frame=0;this.last=0;if(!document.hidden)this.draw(performance.now());};document.addEventListener('visibilitychange',this.visibility);this.resize=()=>this.draw(performance.now());this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);this.draw(performance.now());
 }
 setPhase(phase){this.activity=phase==='hearing'?1:phase==='speaking'||phase==='output'?.85:phase==='working'?.65:phase==='paused'?.08:.3;if(this.reduced())this.draw(performance.now());}
 draw(now){
  if(this.dead||document.hidden)return;cancelAnimationFrame(this.frame);this.frame=0;
  const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const gl=this.gl,w=Math.max(1,Math.round(Math.min(640,rect.width*Math.min(devicePixelRatio||1,1.5)))),h=Math.max(1,Math.round(Math.min(160,rect.height*Math.min(devicePixelRatio||1,1.5))));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;gl.viewport(0,0,w,h);}
  const dt=this.last?Math.min(.05,(now-this.last)/1000):0;this.last=now;this.level+=(this.activity-this.level)*(1-Math.exp(-dt*6));if(!this.reduced())this.time+=dt*(.55+this.level*.8);gl.useProgram(this.program);gl.uniform2f(this.uniforms.iResolution,w,h);gl.uniform1f(this.uniforms.iTime,this.time);gl.uniform1f(this.uniforms.iActivity,this.level);gl.drawArrays(gl.TRIANGLES,0,3);
  if(!this.reduced())this.frame=requestAnimationFrame(time=>this.draw(time));
 }
 destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();if(this.visibility)document.removeEventListener('visibilitychange',this.visibility);const gl=this.gl;if(gl){if(this.buffer)gl.deleteBuffer(this.buffer);if(this.program)gl.deleteProgram(this.program);for(const shader of this.shaders||[])gl.deleteShader(shader);}}
}
