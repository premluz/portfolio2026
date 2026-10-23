import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {heroImageEntrance,HERO_IMAGE_ENTRANCE_SCALE,HERO_IMAGE_ENTRANCE_RATIO,HERO_IMAGE_ENTRANCE_MIN} from '../dist/hero-image-entrance.js';

const calls=[];
const image={animate:(frames,options)=>{calls.push({frames,options});return {frames,options};}};
const root=selector=>({querySelector:q=>q===selector?image:null});
const detail=root('.detail .detail-media-column .visual');
assert(heroImageEntrance(detail,{duration:400}),'A project with a media column animates its hero image');
assert.deepEqual(calls[0].frames,[{transform:`scale(${HERO_IMAGE_ENTRANCE_SCALE})`},{transform:'scale(1)'}],'The image grows from slightly smaller to full size');
assert(HERO_IMAGE_ENTRANCE_SCALE<1&&HERO_IMAGE_ENTRANCE_SCALE>.85,'The growth is slight');
assert.equal(calls[0].options.duration,490,'At the default 0.4s transition the image settles over 0.49s, about a quarter slower than the page fade');
assert(calls[0].options.duration/400>=1.2&&calls[0].options.duration/400<=1.25,'20 to 25 percent longer, not several times longer');
assert.notEqual(calls[0].options.easing,'linear','A soft easing, not a constant rate');
heroImageEntrance(detail,{duration:50});
assert.equal(calls[1].options.duration,HERO_IMAGE_ENTRANCE_MIN,'Very short transitions keep a readable minimum');
heroImageEntrance(detail,{duration:1000});assert.equal(calls[2].options.duration,1000*HERO_IMAGE_ENTRANCE_RATIO,'The Transition duration setting scales the entrance');
assert(heroImageEntrance(root('.detail > .visual'),{duration:400}),'A detail without a media column still finds its image');
assert.equal(heroImageEntrance(detail,{reduced:true}),null,'Reduced motion and animations off do not animate');
assert.equal(heroImageEntrance(root('.nothing'),{}),null,'Pages without a hero image are left alone');
assert.equal(heroImageEntrance(null,{}),null);

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const simple=app.slice(app.indexOf('async function simplePageTransition'),app.indexOf('// A transition that throws must not leave'));
assert(simple.includes('render(route,{stream:true})'),'The simple transition keeps the staggered text reveal');
assert(simple.includes('heroImageEntrance(main,{reduced:reduce.matches,duration})'),'The simple transition grows the hero image');
assert(simple.indexOf('fadeUpIn(')<simple.indexOf('heroImageEntrance('),'The image entrance follows the page fade-in');
console.log('Hero image entrance passed: slight growth, minimum duration, reduced motion, missing image and simple-transition wiring.');
