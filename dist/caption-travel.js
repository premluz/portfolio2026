// Card to project page: the lines a card shows (its title, its company · year) travel into the same lines of the
// project caption. Lines only the page has (the intro, and the results when company · year replaced them on the
// card) are never carried; they stagger in with the page content. With travel off, every caption line staggers in.
const normalized=value=>String(value||'').trim().replace(/\s+/g,' ');
const captionOf=root=>root?.querySelector?.(':scope > .detail-caption');

export function captionTravelTargets(shared,to){
 const lines=[...(captionOf(to)?.children||[])],targets=new Map(),used=new Set();
 for(const key of ['client','title','summary']){
  const source=shared?.[key],text=normalized(source?.node?.textContent);
  if(!source||source.hidden||!text)continue;
  const index=lines.findIndex((line,at)=>!used.has(at)&&normalized(line.textContent)===text);
  if(index<0)continue;
  used.add(index);targets.set(key,{node:lines[index],index});
 }
 return targets;
}

export function captionRevealLines(detail,travel=true){
 const caption=captionOf(detail);if(!caption)return [];
 const lines=[...caption.children];if(!travel)return lines;
 const hasLead=lines.some(line=>line.classList.contains('detail-caption-lead'));
 return lines.filter(line=>line.classList.contains('detail-caption-intro')||hasLead&&line.classList.contains('detail-caption-results'));
}

// A project caption never rides the moving page copy: it stays where the live page shows it and only staggers in or
// fades out. The copy can lay the caption out a little differently, so each copy's caption is pinned to the live
// caption's measured place. A copy is [root, live caption rect, the copy's own end rect, drift], where drift is how far
// the copy is carried towards that rect. Offsets are measured on the first call, once the shell is on the page, and
// inside the copy, so its drift cancels. Returns place(x, y), called with the shell's position each frame.
export function captionPinner(copies){
 let pinned=null;
 const pin=([root,target,rect,drift])=>{
  const node=root.querySelector(':scope > .detail-caption');if(!node||!target)return null;
  const own=node.getBoundingClientRect(),host=root.getBoundingClientRect();
  return {node,target,rect,drift,left:own.left-host.left,top:own.top-host.top};
 };
 return (x,y)=>{
  pinned??=copies.filter(Boolean).map(pin).filter(Boolean);
  for(const item of pinned)item.node.style.transform=`translate(${item.target.left-item.left-x-(item.rect.left-x)*item.drift}px,${item.target.top-item.top-y-(item.rect.top-y)*item.drift}px)`;
 };
}
