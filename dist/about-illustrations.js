const shadow=(rx=30,cy=100)=>`<ellipse cx="60" cy="${cy}" rx="${rx}" ry="6" class="trait-side trait-shadow"/>`;
const coffee=()=>`<ellipse cx="60" cy="89" rx="40" ry="13" class="trait-side"/><ellipse cx="60" cy="86" rx="40" ry="13" class="trait-top"/><ellipse cx="60" cy="86" rx="24" ry="7" class="trait-face"/>`
 +`<path d="M80 63c10-4 17 1 15 9s-11 11-18 7" class="trait-side"/><path d="M80 68c6-2 9 0 8 4s-5 5-9 4" class="trait-top"/>`
 +`<path d="M38 58C38 76 46 87 60 87S82 76 82 58Z" class="trait-face"/><path d="M70 62c0 10-3 18-9 21" class="trait-side"/>`
 +`<ellipse cx="60" cy="58" rx="22" ry="7" class="trait-top"/><ellipse cx="60" cy="59" rx="17" ry="4.5" class="trait-accent"/>`
 +`<path d="M55 47c-5-6 5-9 0-15s4-10 2-14" class="trait-steam"/><path d="M66 48c-3-4 3-6 0-10" class="trait-steam trait-steam-b"/>`;
const roots=()=>shadow(22,95)+`<circle cx="60" cy="56" r="32" class="trait-face"/><path d="M60 24A32 32 0 0 1 60 88A20 32 0 0 0 60 24Z" class="trait-side"/>`
 +`<ellipse cx="60" cy="56" rx="32" ry="9" class="trait-grid"/>`
 +`<g class="trait-continents"><path d="M49 42c1-3 5-4 8-3l3-5c2-3 5-2 5 1l1 3c3-1 7 0 9 2s0 4-3 5-6 2-9 2-6 1-8 0-6-1-6-3Z" class="trait-top"/>`
 +`<path d="M48 52c4-2 9-1 12 0s6-1 9 1 4 5 2 8-4 4-5 8-2 9-6 11-3-2-4-6-3-6-5-10-5-10-3-12Z" class="trait-top"/>`
 +`<circle cx="68" cy="41" r="2" class="trait-accent trait-pin"/></g>`;
const hemisphere=(side,d,folds,fill)=>`<g class="trait-hemisphere trait-hemisphere-${side}"><path d="${d}" class="trait-side" transform="translate(0 5)"/><path d="${d}" class="${fill}"/><path d="${folds}"/></g>`;
const philosophy=()=>shadow(30,92)
 +hemisphere('l','M58 34C50 28 36 30 34 40C26 44 25 56 30 62C28 72 38 80 48 78C52 82 58 80 58 76Z','M36 47c6 0 8 4 14 2M33 59c6-2 10 2 16 0s6 4 9 3M40 70c4-3 9-1 12-4M48 35c-2 4 0 8 4 10','trait-top')
 +hemisphere('r','M62 34C70 28 84 30 86 40C94 44 95 56 90 62C92 72 82 80 72 78C68 82 62 80 62 76Z','M84 47c-6 0-8 4-14 2M87 59c-6-2-10 2-16 0s-6 4-9 3M80 70c-4-3-9-1-12-4M72 35c2 4 0 8-4 10','trait-face')
 +`<path d="M60 12l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2Z" class="trait-accent trait-spark"/>`;
const heartPath='M60 88C44 76 30 64 30 48C30 38 38 31 47 31C53 31 58 35 60 40C62 35 67 31 73 31C82 31 90 38 90 48C90 64 76 76 60 88Z';
const interests=()=>shadow(26)+`<g class="trait-heart"><path d="${heartPath}" class="trait-side" transform="translate(5 4)"/><path d="${heartPath}" class="trait-face"/>`
 +`<path d="M36 48c0-7 5-11 11-11 3 0 6 1 7 4-6 0-13 2-18 7Z" class="trait-top"/><path d="M80 44c2 4 1 10-3 15" class="trait-side"/></g>`
 +`<path d="M93 31c-4-3-7-5-7-9 0-2 2-4 4-4 1.5 0 2.5 1 3 2 .5-1 1.5-2 3-2 2 0 4 2 4 4 0 4-3 6-7 9Z" class="trait-accent trait-spark"/>`;
const eyePath='M30 60C40 47 50 42 60 42S80 47 90 60C80 73 70 78 60 78S40 73 30 60Z';
const sixthSense=()=>`<path d="M40 49L18 30M60 42V14M80 49L102 30M86 70L104 92M34 70L16 92M18 30L60 14L102 30" pathLength="1" class="trait-ray"/>`
 +[[18,30],[60,14],[102,30],[104,92],[16,92]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.2" class="trait-face trait-node"/>`).join('')
 +`<path d="${eyePath}" class="trait-side" transform="translate(0 5)"/><path d="${eyePath}" class="trait-top"/><path d="M34 51C45 38 75 38 86 51" class="trait-lid"/>`
 +`<g class="trait-eye"><circle cx="60" cy="60" r="11" class="trait-face"/><circle cx="60" cy="60" r="5" class="trait-accent"/><circle cx="62.5" cy="57.5" r="1.4" class="trait-top"/></g>`;
const seventhSense=()=>shadow(28)+`<circle cx="64" cy="62" r="31" class="trait-side"/><circle cx="60" cy="58" r="31" class="trait-face"/><path d="M37 49c3-10 11-17 21-18-8 4-14 10-18 19Z" class="trait-top"/>`
 +`<ellipse cx="49" cy="50" rx="2.4" ry="3.4" class="trait-ink"/><path d="M67 51q4.5-5 9 0" class="trait-wink"/>`
 +`<path d="M43 63q17 15 34 0q-17 5-34 0Z" class="trait-top trait-smile"/>`
 +`<path d="M95 20l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5Z" class="trait-accent trait-spark"/>`;
const figures={'trait-coffee':coffee,'trait-roots':roots,'trait-philosophy':philosophy,'trait-interests':interests,'trait-sixth-sense':sixthSense,'trait-seventh-sense':seventhSense};
export function traitIllustration(id){
 const draw=Object.hasOwn(figures,id)?figures[id]:null;return draw?`<svg class="about-trait-art" aria-hidden="true" viewBox="0 0 120 120" fill="none"><g class="trait-body" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">${draw()}</g></svg>`:'';
}
