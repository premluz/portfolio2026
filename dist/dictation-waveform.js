// Duplicate the level history for a seamless CSS ticker. It keeps moving in
// silence; incoming microphone levels still drive the height of both copies.
export function mountDictationWaveform(node){
 const track=document.createElement('span');track.className='dictation-wave-track';
 const bars=[...node.children],copies=bars.map(bar=>bar.cloneNode(true)),levels=bars.map(()=>0);
 track.append(...bars,...copies);node.append(track);
 return {setLevel(value){const level=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;levels.shift();levels.push(level);bars.forEach((bar,index)=>{for(const item of [bar,copies[index]]){item.style.setProperty('--voice-bar-height',(2+levels[index]*24)+'px');item.style.setProperty('--voice-bar-opacity',String(.35+levels[index]*.65));}});}};
}
