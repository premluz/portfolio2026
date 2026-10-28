// A short confirmation next to the control that was just used, in the tooltip's look: above it, as the normal tooltip sits,
// or below when there is no room above.
// The shared site toast stays for actions without a visible target.
export const ANCHORED_NOTICE_MS=1800,ANCHORED_NOTICE_GAP=10;
let notice=null,timer=null;
const hide=()=>{clearTimeout(timer);timer=null;if(notice)notice.hidden=true;};
export function showNoticeNear(anchor,text,{duration=ANCHORED_NOTICE_MS}={}){
 if(!notice){
  notice=document.createElement('div');notice.className='site-tooltip anchored-notice';notice.setAttribute('role','status');notice.hidden=true;document.body.append(notice);
  addEventListener('scroll',hide,true);addEventListener('resize',hide);
 }
 hide();notice.textContent=text;notice.hidden=false;
 const r=anchor.getBoundingClientRect(),n=notice.getBoundingClientRect();
 notice.style.left=`${Math.max(12,Math.min(innerWidth-n.width-12,r.left+(r.width-n.width)/2))}px`;
 notice.style.top=`${r.top-n.height-ANCHORED_NOTICE_GAP>=ANCHORED_NOTICE_GAP?r.top-n.height-ANCHORED_NOTICE_GAP:r.bottom+ANCHORED_NOTICE_GAP}px`;
 timer=setTimeout(hide,duration);
}
