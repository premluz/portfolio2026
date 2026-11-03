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
