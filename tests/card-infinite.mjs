import assert from 'node:assert/strict';
import {INFINITE_DEFAULTS as O,chunkOffsets,chunkCards,chunkOf,cardOpacity,stepFlight,hashString} from '../dist/card-infinite-chunks.js';

// Chunks are deterministic: revisiting a place shows the same cards.
assert.deepEqual(chunkCards(3,-2,1,14),chunkCards(3,-2,1,14),'Same chunk, same cards');
assert.notDeepEqual(chunkCards(3,-2,1,14),chunkCards(3,-2,2,14),'Neighbouring chunks differ');
assert.notEqual(hashString('1,2,3'),hashString('3,2,1'));
const cards=chunkCards(0,0,0,14);assert.equal(cards.length,O.cardsPerChunk);
for(const card of cards){assert(card.x>=0&&card.x<O.chunkSize&&card.y>=0&&card.y<O.chunkSize&&card.z>=0&&card.z<O.chunkSize,'Cards stay inside their chunk');assert(card.height>=O.minHeight&&card.height<=O.minHeight+O.heightRange);assert(card.item>=0&&card.item<14);}

// Chunks around the camera: a cube of side 2*(render distance + fade margin)+1.
const reach=O.renderDistance+O.fadeMargin;assert.equal(chunkOffsets().length,(2*reach+1)**3);
assert.deepEqual(chunkOf({x:-1,y:110,z:219}),{cx:-1,cy:1,cz:1});

// Fades: full inside the render distance and near depth, none past the depth limit or the fade ring.
const centre={cx:0,cy:0,cz:0},camera={x:0,y:0,z:50};
assert.equal(cardOpacity({z:40},centre,camera,centre),1);
assert.equal(cardOpacity({z:50-O.depthFadeEnd-1},centre,camera,centre),0,'Beyond the fog nothing shows');
assert(cardOpacity({z:50-200},centre,camera,centre)<1,'Depth fades like fog');
assert.equal(cardOpacity({z:40},{cx:reach,cy:0,cz:0},camera,centre),0,'The outer ring has faded out');

// Flight: input becomes velocity with inertia, then glides to a stop.
let flight={position:{x:0,y:0,z:50},velocity:{x:0,y:0,z:0},target:{x:0,y:0,z:0},wheel:0};
flight=stepFlight(flight,{dragX:100,dragY:0,keyX:0,keyY:0,keyZ:0});
assert(flight.velocity.x<0,'Dragging right moves the view so content follows the pointer');
for(let i=0;i<120;i++)flight=stepFlight(flight,{dragX:0,dragY:0,keyX:0,keyY:0,keyZ:0});
assert(Math.abs(flight.velocity.x)<.01&&flight.position.x<0,'It glides, then settles');
flight=stepFlight({...flight,wheel:2},{dragX:0,dragY:0,keyX:0,keyY:0,keyZ:0});assert(flight.velocity.z>0,'Scrolling flies along depth');
let fast=flight;for(let i=0;i<60;i++)fast=stepFlight(fast,{dragX:5000,dragY:0,keyX:0,keyY:0,keyZ:0});
assert(Math.abs(fast.velocity.x)<=O.maxVelocity+1e-9,'Speed is capped');
console.log('Infinite card space passed: deterministic chunks, chunk cube, depth and ring fades, inertial flight with a speed cap.');
