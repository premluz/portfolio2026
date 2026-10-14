const cube=(x,y,size=22,depth=30,accent=false)=>`<g><path d="M${x} ${y}l${size} ${size*.55}v${depth}l-${size} -${size*.55}Z" class="service-side"/><path d="M${x+size} ${y+size*.55}l${size} -${size*.55}v${depth}l-${size} ${size*.55}Z" class="service-face"/><path d="M${x} ${y}l${size} -${size*.55}l${size} ${size*.55}l-${size} ${size*.55}Z" class="${accent?'service-accent':'service-top'}"/></g>`;
const plate=(y,filled=false)=>`<path d="M57 ${y+48}L157 ${y-8}Q165 ${y-12}173 ${y-8}L268 ${y+45}Q278 ${y+51}269 ${y+57}L174 ${y+111}Q165 ${y+116}156 ${y+111}L57 ${y+56}Q49 ${y+52}57 ${y+48}Z" class="${filled?'service-face':'service-top'}"/>`;
const figures={
 'service-product-design':()=>[...Array(3)].flatMap((_,row)=>[...Array(3)].map((_,col)=>cube(82+col*45+row*27,100-col*25+row*17,22,26,row===0&&col===2))).join(''),
 'service-prototyping':()=>plate(89,true)+plate(78,true)+plate(67,true)+plate(42)+`<path d="M125 76l38 -22 37 22-38 21Z M163 54v43 M125 76h75 M195 98l37 21 M176 109l21 12" fill="none"/><path d="M124 132l21 -12 29 16-21 13Z" class="service-accent"/>`,
 'service-brand-motion':()=>`<path d="M38 177H289 M58 150Q88 61 154 115T260 141" class="service-dashed" fill="none"/>`+cube(54,134,26,39)+cube(124,96,26,39)+cube(226,134,26,39,true)+`<circle cx="80" cy="143" r="3"/><circle cx="150" cy="104" r="3"/>`,
 'service-design-lead':()=>[0,1,2,3].map(i=>cube(68+i*39,172-i*27,25,25+i*15,i===3)).join('')+`<path d="M210 82l52 -57" class="service-dashed" fill="none"/><circle cx="266" cy="20" r="5"/>`,
 'service-hiring':()=>plate(96,true)+cube(82,116,24,37)+cube(137,83,24,37)+cube(192,113,24,37,true)+cube(137,149,24,37)+cube(244,146,24,37),
 'service-coaching':()=>`<ellipse cx="128" cy="150" rx="72" ry="37" transform="rotate(-16 128 150)" class="service-face"/><ellipse cx="128" cy="142" rx="72" ry="37" transform="rotate(-16 128 142)" class="service-top"/><ellipse cx="206" cy="112" rx="72" ry="37" transform="rotate(-16 206 112)" class="service-face"/><ellipse cx="206" cy="104" rx="72" ry="37" transform="rotate(-16 206 104)" class="service-top"/><ellipse cx="169" cy="116" rx="31" ry="39" transform="rotate(-16 169 116)" class="service-accent"/>`
};
export function serviceIllustration(id){
 const draw=figures[id];return draw?`<svg class="service-illustration" aria-hidden="true" viewBox="0 0 330 230" fill="none"><g stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">${draw()}</g></svg>`:'';
}
