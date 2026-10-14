// Rotation- and hand-size-independent joint geometry. Thumb and fingertips
// are interpreted relative to the palm, rather than screen "up"/"down".
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export const gestureTuning=Object.freeze({armTimeout:1200,clickDwell:90,pinchEnter:.34,pinchExit:.5,pinchPrepare:.8,scrollHold:350,scrollAfterAction:650,tiltEnter:12,tiltExit:7,tiltRange:55});
function angle(a,b,c) {
  const u=[a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0)],v=[c.x-b.x,c.y-b.y,(c.z||0)-(b.z||0)];
  const product=Math.hypot(...u)*Math.hypot(...v);
  return product?Math.acos(clamp(u.reduce((sum,x,i)=>sum+x*v[i],0)/product,-1,1))*180/Math.PI:0;
}
export function classifyHand(landmarks,worldLandmarks) {
  if(!Array.isArray(landmarks)||landmarks.length!==21||landmarks.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  // Metric 3D joints keep tilted and edge-on hands readable. Screen landmarks
  // still own cursor/scroll coordinates, so camera orientation is not a pose.
  const world=Array.isArray(worldLandmarks)&&worldLandmarks.length===21&&worldLandmarks.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));
  const p=world?worldLandmarks:landmarks,palm=distance(p[5],p[17]);
  if(palm<(world ? .008 : .025))return null;
  const fingers=[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]].map(([mcp,pip,dip,tip])=>{
    const ratio=distance(p[tip],p[0])/Math.max(.001,distance(p[pip],p[0]));
    return {extended:angle(p[mcp],p[pip],p[tip])>140&&angle(p[pip],p[dip],p[tip])>135&&ratio>1.06,
      folded:angle(p[mcp],p[pip],p[tip])<125||ratio<1.04};
  });
  const joined=distance(p[8],p[12])<palm*.58;
  const twoFingers=fingers[2].folded&&fingers[3].folded&&joined;
  // A pinch bends the pointing fingers. Require their reach, rather than
  // perfectly straight joints, while rejecting a thumb resting on a fist.
  const pinchable=twoFingers&&[5,9].every(mcp=>distance(p[mcp+3],p[mcp])>palm*.55&&distance(p[mcp+3],p[0])>distance(p[mcp],p[0])*1.08);
  const pinchDistance=pinchable?Math.max(distance(p[4],p[8]),distance(p[4],p[12]))/palm:Infinity;
  let pose='other';
  // Joined fingers with the thumb away (L-shape) point; moving the thumb
  // toward their tips freezes targeting before contact. Four fingers scroll.
  if(fingers.every(f=>f.extended))pose='palm';
  else if(pinchDistance<gestureTuning.pinchPrepare)pose='pinch';
  else if(fingers.every(f=>f.folded))pose='fist';
  else if(twoFingers&&fingers[0].extended&&fingers[1].extended)pose='pointer';
  const x=1-(landmarks[8].x+landmarks[12].x)/2,y=(landmarks[8].y+landmarks[12].y)/2;
  const center=[0,5,9,13,17].reduce((point,index)=>({x:point.x+landmarks[index].x/5,y:point.y+landmarks[index].y/5}),{x:0,y:0});
  // Camera y increases downward. Wrist→knuckle pitch is signed regardless of
  // which hand or which face of the palm the camera sees. No palm-facing gate.
  const axis=[5,9,13,17].reduce((v,index)=>({x:v.x+(p[index].x-p[0].x)/4,y:v.y+(p[index].y-p[0].y)/4,z:v.z+((p[index].z||0)-(p[0].z||0))/4}),{x:0,y:0,z:0});
  const palmTilt=Math.hypot(axis.x,axis.y,axis.z)>palm*.6?Math.atan2(axis.y,Math.hypot(axis.x,axis.z))*180/Math.PI:null;
  return {pose,pinchDistance,palmTilt,point:{x:clamp((x-.12)/.76),y:clamp((y-.1)/.72)},swipePoint:{x,y},palmPoint:{x:1-center.x,y:center.y}};
}

// L-shape→thumb contact commits once. Holding an open hand enters tilt scroll:
// flat stops, fingertips down/up scroll down/up. A brief palm→fist is Back.
const armTimeout=gestureTuning.armTimeout;
export class GestureIntent {
  constructor(){this.reset();}
  reset(){this.candidate=null;this.since=0;this.stable=null;this.arm=null;this.scrollState=null;this.backConsumed=false;this.scrollBlocked=false;this.history=[];this.latched=false;this.cooldown=0;this.point=null;this.contactSince=null;}
  update(hand,time,{allowSwipe=true}={}) {
    const result={cursor:null,cursorMode:'none',scrolling:false,scroll:null,cue:'Show two joined fingers · thumb away',command:null};
    if(!hand) {
      // Never activate a remembered target after tracking is lost.
      // Keep release guards through dropped frames until a release is seen.
      this.arm=null;this.scrollState=null;this.history=[];this.stable=null;this.candidate=null;this.point=null;this.contactSince=null;
      return result;
    }
    if(this.candidate!==hand.pose){this.candidate=hand.pose;this.since=time;}
    if(hand.pose!=='pinch')this.contactSince=null;
    else if(this.arm?.mode==='click'&&!this.latched) {
      if(hand.pinchDistance<=gestureTuning.pinchEnter)this.contactSince??=time;
      else if(hand.pinchDistance>gestureTuning.pinchExit)this.contactSince=null;
    }
    if(this.arm?.mode==='click'&&time-this.arm.time<armTimeout){result.cursor=this.arm.point;result.cursorMode='hold';result.cue='Touch thumb to both fingertips to click';}
    const threshold=hand.pose==='pointer'?120:90;
    if(time-this.since<threshold) {
      return result;
    }
    this.stable=hand.pose;
    if(hand.pose==='pointer') {
      // The last two fingers can remain straight while an open palm closes.
      // Preserve that Back sequence through this intermediate posture.
      if(this.arm?.mode==='back'&&time-this.arm.time<armTimeout){result.cursor=null;result.cursorMode='none';result.cue='Back armed · close your hand';this.history=[];return result;}
      this.scrollState=null;this.scrollBlocked=false;
      this.point={...hand.point};result.cursor=this.point;result.cursorMode='point';result.cue='L-shape · touch thumb to both fingertips to click';this.latched=false;
      if(time<this.cooldown)return result;
      this.backConsumed=false;
      this.arm={mode:'click',time,point:this.point};
      const point=hand.swipePoint||hand.point;
      this.history=this.history.filter(item=>time-item.time<600);
      this.history.push({...point,time});
      const first=this.history[0],dx=point.x-first.x,dy=point.y-first.y,elapsed=time-first.time;
      if(allowSwipe&&elapsed>=100&&Math.abs(dx)>.26&&Math.abs(dx)>Math.abs(dy)*2.5&&Math.abs(dx)/Math.max(.1,elapsed/1000)>.9) {
        result.command={id:dx<0?'project.next':'project.previous',source:'gesture'};
        result.cue=dx<0?'Next project':'Previous project';this.cooldown=time+1000;this.arm=null;this.backConsumed=true;this.history=[];
      }
    } else if(hand.pose==='pinch') {
      this.history=[];this.scrollState=null;
      const arm=this.arm;
      if(arm?.mode==='click'&&time-arm.time<armTimeout&&!this.latched&&time>=this.cooldown) {
        result.cursor=arm.point;result.cursorMode='hold';result.cue='Touch thumb to both fingertips to click';
        if(this.contactSince!==null&&time-this.contactSince>=gestureTuning.clickDwell) {
          result.command={id:'pointer.activate',point:arm.point,source:'gesture'};result.cue='Click';
          this.backConsumed=true;this.arm=null;this.latched=true;this.cooldown=time+450;this.contactSince=null;
        }
      } else {result.cursor=null;result.cursorMode='none';result.cue='Release thumb and point to click';}
    } else if(hand.pose==='palm') {
      result.cursor=null;result.cursorMode='none';this.history=[];
      // Opening after a click/swipe may scroll after an extra hold, but its
      // release must never reverse the newly opened project.
      const consumed=this.backConsumed||this.arm?.mode==='click';
      this.backConsumed=Boolean(consumed);
      if(this.scrollBlocked){this.arm=null;result.cue='Release your hand to continue';return result;}
      if(!this.scrollState)this.scrollState={consumed:Boolean(consumed),readyAt:time+(consumed?gestureTuning.scrollAfterAction:gestureTuning.scrollHold),filteredTilt:hand.palmTilt??0,sampleTime:time,point:this.point||hand.point,active:false};
      const scroll=this.scrollState;
      if(time<scroll.readyAt) {
        if(!scroll.consumed){this.latched=false;this.arm={mode:'back',time};}
        else this.arm=null;
        result.cue=scroll.consumed?'Hold open hand flat to scroll':'Hold open hand flat to scroll · close for Back';return result;
      }
      this.arm={mode:'scroll',time};this.backConsumed=true;
      const tilt=hand.palmTilt,alpha=1-Math.exp(-Math.max(0,time-scroll.sampleTime)/70);
      // Neutral and reversal take effect immediately; only same-direction
      // tilt is smoothed. Moving the whole hand does not change scroll speed.
      if(!Number.isFinite(tilt)||Math.abs(tilt)<gestureTuning.tiltExit){scroll.filteredTilt=0;scroll.active=false;}
      else if(Math.sign(tilt)!==Math.sign(scroll.filteredTilt)&&Math.abs(tilt)>gestureTuning.tiltEnter)scroll.filteredTilt=tilt;
      else scroll.filteredTilt+=(tilt-scroll.filteredTilt)*alpha;
      scroll.sampleTime=time;
      if(!scroll.active&&Math.abs(scroll.filteredTilt)>gestureTuning.tiltEnter)scroll.active=true;
      else if(scroll.active&&Math.abs(scroll.filteredTilt)<gestureTuning.tiltExit)scroll.active=false;
      const magnitude=clamp((Math.abs(scroll.filteredTilt)-gestureTuning.tiltExit)/(gestureTuning.tiltRange-gestureTuning.tiltExit));
      const rate=scroll.active?Math.sign(scroll.filteredTilt)*Math.pow(magnitude,1.3):0;
      result.scrolling=true;result.scroll={rate,point:scroll.point,tilt:scroll.filteredTilt};
      result.cue=rate===0?'Scroll ready · keep hand flat to stop':rate>0?'Scroll down · flatten hand to stop':'Scroll up · flatten hand to stop';
    } else if(hand.pose==='fist') {
      result.cursor=null;result.cursorMode='none';this.history=[];
      if(!this.latched&&this.arm?.mode==='back'&&time-this.arm.time<armTimeout) {
        result.command={id:'navigation.back',source:'gesture'};result.cue='Back';
        this.cooldown=time+650;this.latched=true;
      }
      this.arm=null;this.scrollState=null;this.backConsumed=false;this.scrollBlocked=false;
    } else {
      this.history=[];this.scrollState=null;
      if(this.arm?.mode==='scroll')this.arm=null;
      if(this.arm&&time-this.arm.time>armTimeout)this.arm=null;
    }
    return result;
  }
  cancelScroll(){if(this.scrollState||this.arm?.mode==='scroll')this.scrollBlocked=true;this.arm=null;this.contactSince=null;}
}
