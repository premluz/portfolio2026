import {CardWorld} from './card-world.js';
import {createSpiralArrangement} from './card-spiral.js';
import {createInfiniteArrangement} from './card-infinite.js';
import {createSphereArrangement} from './card-sphere.js';

export const CARD_ARRANGEMENTS={spiral:createSpiralArrangement,infinite:createInfiniteArrangement,sphere:createSphereArrangement};

export const mountCardWorld=(root,{reduced,onOpen})=>new CardWorld(root,{items:JSON.parse(root.querySelector('[data-card-world-items]')?.textContent||'[]'),arrangement:CARD_ARRANGEMENTS[root.dataset.cardWorld](),reduced,onOpen});
