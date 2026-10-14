// The carousel receives portfolio projects only; information routes stay separate.
export function adjacentCard(cards,current,direction){
 const index=cards.findIndex(card=>card.id===current);
 if(index<0||!cards.length)return null;
 return cards[((index+direction)%cards.length+cards.length)%cards.length];
}
// Work is the unselected project-sequence state: Next enters at the first
// project and Previous wraps to the last. Portfolio routes use normal wraparound.
export function stepProject(cards,current,direction,{workRoute='work'}={}){
 if(!cards.length)return null;
 if(current===workRoute)return direction<0?cards.at(-1):cards[0];
 return adjacentCard(cards,current,direction);
}
export function cardNavigation(from,to,ids,{slide=false,direction=0}={}){
 const source=ids.indexOf(from),target=ids.indexOf(to);
 return {kind:slide||(source>=0&&target>=0)?'slide':'morph',direction:direction||(slide?1:target>source?1:-1)};
}
