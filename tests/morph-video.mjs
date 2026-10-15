import assert from 'node:assert/strict';

// Minimal DOM: elements live in parents, so moves are observable; comments mark placeholders.
class El{
 constructor(tag,attrs={}){this.tag=tag;this.children=[];this.parent=null;this.style={cssText:''};this.dataset={...attrs.dataset};this.paused=attrs.paused??true;this.classes=new Set();this.classList={add:(...n)=>n.forEach(x=>this.classes.add(x)),remove:(...n)=>n.forEach(x=>this.classes.delete(x)),contains:n=>this.classes.has(n)};this.listeners=new Map();}
 append(...nodes){for(const node of nodes){node.parent?.children.splice(node.parent.children.indexOf(node),1);node.parent=this;this.children.push(node);}}
 replaceWith(node){const list=this.parent.children,at=list.indexOf(this);node.parent?.children.splice(node.parent.children.indexOf(node),1);list.splice(at,1,node);node.parent=this.parent;this.parent=null;}
 querySelector(){return this.children.find(child=>child.tag==='video')||null;}
 querySelectorAll(){return this.children.filter(child=>child.tag==='video');}
 addEventListener(type,fn){this.listeners.set(type,fn);}removeEventListener(type){this.listeners.delete(type);}
 matches(){return false;}closest(){return null;}
 get parentNode(){return this.parent;}getBoundingClientRect(){return {width:0,height:0};}
}
const doc={createComment:text=>new El('#comment',{dataset:{text}})};
globalThis.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
globalThis.document={hidden:false,addEventListener(){},removeEventListener(){},documentElement:{classList:{contains:()=>false}}};
globalThis.getComputedStyle=()=>({visibility:'visible'});

const {HoverVideo,playingVideoState,pauseVideoPreviews}=await import('../dist/hover-video.js');
const {carryVideo,landVideo,syncMorphVideo}=await import('../dist/morph-video.js');

function frame(url,{playing=false}={}){
 const visual=new El('div'),video=new El('video',{dataset:{videoUrl:url},paused:!playing});video.style.cssText=`frame:${url}`;video.pause=()=>{video.paused=true;};video.play=()=>{video.paused=false;return Promise.resolve();};
 visual.append(video);const preview=new HoverVideo(visual,video);if(playing){preview.active=true;visual.classList.add('video-preview-playing');}
 return {visual,video,preview};
}

// Opening: the card's playing element travels into the picture, then into the detail frame.
{
 const card=frame('a.mp4',{playing:true}),detail=frame('a.mp4'),picture=new El('div');
 assert.equal(playingVideoState({querySelectorAll:()=>[card.video]})?.element,card.video,'The playing card clip is the element that will travel');
 pauseVideoPreviews(card.video);assert.equal(card.video.paused,false,'Preparing the morph does not pause the clip it will carry');
 const carried=carryVideo(card.video,picture,doc);
 assert.equal(card.video.parent,picture,'The same element moves into the moving picture');assert.equal(card.video.paused,false,'It keeps playing while moving');
 assert(picture.classList.contains('video-preview-playing'),'The moving picture shows it at once, with no first-frame wait');
 assert.equal(card.preview.active,false,'The card player stops owning it without pausing it');assert.equal(card.visual.children[0].tag,'#comment','A placeholder marks where it came from');
 syncMorphVideo(carried,{style:{position:'absolute',left:'1px',top:'2px',width:'3px',height:'4px',borderRadius:'25px',clipPath:'none'}});assert.equal(card.video.style.borderRadius,'25px','The clip keeps the image frame rounding every frame');
 const idle=detail.video;landVideo(carried,detail.visual);
 assert.equal(detail.visual.children[0],card.video,'The detail frame now holds the playing element');assert.equal(card.video.paused,false);
 assert.equal(card.video.style.cssText,'frame:a.mp4','It takes the detail frame geometry');
 assert.equal(detail.preview.video,card.video,'The detail player adopts it');assert.equal(detail.preview.active,true);assert(detail.visual.classList.contains('video-preview-playing'),'It is visible in the detail with no still-image gap');
 assert.equal(card.visual.children[0],idle,'The detail’s idle element goes back to the card frame');assert.equal(card.preview.video,idle);assert.equal(card.preview.active,false,'The card is ready to play its own clip later');
}

// Escape mid-flight, or a receiver without the same clip: the element returns home and keeps playing.
for(const receiver of [null,frame('other.mp4').visual]){
 const card=frame('a.mp4',{playing:true}),picture=new El('div'),carried=carryVideo(card.video,picture,doc);
 landVideo(carried,receiver);
 assert.equal(card.visual.children[0],card.video,'The clip returns to its own frame');assert.equal(card.video.style.cssText,'frame:a.mp4');assert.equal(card.preview.active,true,'Its player owns it again, still playing');
}

assert.equal(carryVideo(frame('a.mp4').video,new El('div'),doc),null,'A paused clip is not carried');
assert.equal(carryVideo(null,new El('div'),doc),null);landVideo(null,null);
console.log('Morph video passed: one playing element carried card → picture → detail, swapped frames, rounding, Escape and no-op cases.');
