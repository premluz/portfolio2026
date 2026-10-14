// One viewport input owns voice steps and continuous hand scrolling. Camera
// samples set speed; display frames move content. No camera-rate position jumps.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export class ViewportScroll {
  constructor({window=globalThis.window,document=globalThis.document}={}) {
    Object.assign(this,{window,document,frame:0,mode:null,target:null,velocity:0});
  }
  resolve(element,point) {
    if(element?.isConnected)return element;
    let hit=point?this.document.elementFromPoint(point.x*this.window.innerWidth,point.y*this.window.innerHeight):null;
    while(hit&&hit!==this.document.body&&hit!==this.document.documentElement) {
      const overflow=this.window.getComputedStyle?.(hit).overflowY;
      if(hit.scrollHeight>hit.clientHeight+1&&/auto|scroll/.test(overflow)&&!hit.closest('[inert],[aria-hidden="true"]'))return hit;
      hit=hit.parentElement;
    }
    return this.window;
  }
  height(){return this.target===this.window?this.window.innerHeight:this.target.clientHeight;}
  canMove(direction) {
    if(this.target!==this.window&&!this.target?.isConnected)return false;
    const element=this.target===this.window?this.document.scrollingElement:this.target;
    if(!element||!Number.isFinite(element.scrollTop))return true;
    const max=Math.max(0,element.scrollHeight-element.clientHeight);
    return direction<0?element.scrollTop>.5:element.scrollTop<max-.5;
  }
  move(top){this.target.scrollBy({top,behavior:'instant'});}
  now(){return (this.window.performance||globalThis.performance).now();}
  schedule(){if(!this.frame)this.frame=this.window.requestAnimationFrame(time=>this.tick(time));}
  step(direction,{element=null,smooth=true}={}) {
    this.stop();this.target=this.resolve(element);
    if(!this.canMove(direction)){this.stop();return {ok:true,message:direction<0?'Top reached':'Bottom reached'};}
    this.distance=this.height()*.72*(direction<0?-1:1);
    if(!smooth||!this.window.requestAnimationFrame){this.move(this.distance);this.stop();}
    else{this.mode='step';this.startTime=null;this.applied=0;this.schedule();}
    return {ok:true,message:direction<0?'Scroll up':'Scroll down'};
  }
  rate(value,{element=null,point=null}={}) {
    // A voice step completes before hand input can take over its viewport.
    if(this.mode==='step')return;
    const rate=Number.isFinite(value)?clamp(value,-1,1):0;
    if(!rate){this.stopRate();return;}
    if(!this.window.requestAnimationFrame)return;
    if(this.mode!=='rate'){this.target=this.resolve(element,point);this.velocity=0;this.lastTime=null;}
    else if(Math.sign(rate)!==Math.sign(this.targetVelocity))this.velocity=0;
    if(!this.canMove(rate)){this.stop();return;}
    this.mode='rate';this.targetVelocity=rate*this.height()*1.1;
    this.expires=this.now()+350;this.schedule();
  }
  tick(time) {
    this.frame=0;
    if(!this.mode||!this.canMove(this.mode==='rate'?this.targetVelocity:this.distance)){this.stop();return;}
    if(this.mode==='step') {
      this.startTime??=time-16;
      const progress=clamp((time-this.startTime)/280,0,1),position=this.distance*(1-Math.pow(1-progress,3));
      this.move(position-this.applied);this.applied=position;
      if(progress===1){this.stop();return;}
    } else {
      // A stalled worker cannot leave the page scrolling from stale hand data.
      if(time>this.expires){this.stop();return;}
      const dt=this.lastTime===null?16:clamp(time-this.lastTime,0,50);this.lastTime=time;
      this.velocity+=(this.targetVelocity-this.velocity)*(1-Math.exp(-dt/65));
      this.move(this.velocity*dt/1000);
    }
    this.schedule();
  }
  stopRate(){if(this.mode==='rate')this.stop();}
  stop(){if(this.frame)this.window.cancelAnimationFrame(this.frame);this.frame=0;this.mode=null;this.target=null;this.velocity=0;}
}
