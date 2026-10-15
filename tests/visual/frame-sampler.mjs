// Runs inside the page: records, every animation frame, which media frames are painted and whether
// each shows its video or only the still image. Timing evidence comes from inside the page itself.
export function startFrameSampler(){
 const frames=[],start=performance.now();
 const describe=visual=>{
  const rect=visual.getBoundingClientRect();
  const painted=visual.checkVisibility?.({opacityProperty:true,visibilityProperty:true})&&rect.width>40&&rect.height>40&&rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
  if(!painted)return null;
  const video=visual.querySelector('video');
  // The layers inside the frame in paint order, so a still image or canvas drawn over the clip is visible in the data.
  const layers=[...visual.children].map(node=>{const st=getComputedStyle(node);return {tag:node.tagName,cls:(node.className?.baseVal??node.className??'').toString().slice(0,30),opacity:Number(st.opacity),visibility:st.visibility,z:st.zIndex};});
  return {
   url:video?.dataset.videoUrl||'',
   videoOpacity:video?Number(getComputedStyle(video).opacity):null,
   layers,
   where:visual.closest('.flow-shell')?'morph':visual.closest('.detail')?'detail':visual.closest('[data-gallery-item]')?'gallery':'other',
   playing:visual.classList.contains('video-preview-playing'),
   videoPainting:!!video&&!video.paused&&video.readyState>=2,
   rect:[rect.left,rect.top,rect.width,rect.height].map(Math.round)
  };
 };
 const tick=()=>{
  frames.push({t:Math.round(performance.now()-start),hash:location.hash,transition:document.documentElement.classList.contains('route-transition'),overlay:!!document.querySelector('.morph-video-overlay'),visuals:[...document.querySelectorAll('.visual')].map(describe).filter(Boolean)});
  if(!window.__stopFrames)requestAnimationFrame(tick);
 };
 window.__frames=frames;window.__stopFrames=false;requestAnimationFrame(tick);
}
// A frame flashes when the opened project's clip is not on screen as video: either a painted frame for it
// shows the still image, or nothing for it is painted at all (a blank gap mid-transition).
export function stillImageFrames(frames,url){
 return frames.filter(frame=>{const mine=frame.visuals.filter(item=>item.where==='morph'||item.url===url);return !mine.length||mine.some(item=>!item.playing||!item.videoPainting||item.videoOpacity!==null&&item.videoOpacity<1);});
}
// Frames where the moving picture is painted away from where the previous frame had it (a jump).
export function jumpFrames(frames,limit=160){
 const out=[];let last=null;
 for(const frame of frames){const morph=frame.visuals.find(item=>item.where==='morph');if(morph&&last&&Math.hypot(morph.rect[0]-last.rect[0],morph.rect[1]-last.rect[1])>limit)out.push(frame);last=morph||null;}
 return out;
}
