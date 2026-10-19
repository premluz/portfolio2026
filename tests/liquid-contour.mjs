import assert from 'node:assert/strict';
import {roundedRectDistance,smoothMin,liquidField,liquidOutline,needsLiquid} from '../dist/liquid-contour.js';
import {liquidBlend,splitBlend,dockLiquidShapes,LIQUID_DEFAULTS} from '../dist/dock-liquid.js';
import {dockGeometry} from '../dist/dock-morph.js';

const loops=path=>(path?.match(/M /g)||[]).length;
const pill=(x,width,blend=0)=>({x,y:0,width,height:48,radius:24,blend,moving:blend>0});

// Distance field basics.
assert(roundedRectDistance(50,24,pill(0,100))<0,'Inside is negative');assert(roundedRectDistance(150,24,pill(0,100))>0,'Outside is positive');
assert(Math.abs(roundedRectDistance(100,24,pill(0,100)))<1e-9,'The edge is zero');
assert.equal(smoothMin(3,5,0),3,'No blend is a hard union');assert(smoothMin(3,3,8)<3,'Blending pulls the surface outward where shapes meet');

// Two pills fuse into one outline while close and blended, and stay two crisp shapes otherwise.
assert.equal(liquidOutline([pill(0,200),pill(212,100)]),null,'At rest the exact analytic shapes are kept');
assert.equal(loops(liquidOutline([pill(0,200),pill(212,100,32)])),1,'A 12px gap fuses into one lobe under a 32px blend');
assert.equal(loops(liquidOutline([pill(0,200),pill(240,100,32)])),2,'A 40px gap pinches off into two lobes');
assert(!needsLiquid([pill(0,200,40)]),'A single shape never needs the contour');
assert(needsLiquid([pill(0,200),{...pill(212,100),moving:true}]),'A moving piece is traced even when its blend has reached zero, so the outline never swaps mid-move');

// The neck: the field between two fused pills is inside along the axis, and the waist narrows as they part.
const waist=gap=>{let inside=0;for(let y=-10;y<=58;y+=.5)if(liquidField(200+gap/2,y,[pill(0,200),pill(200+gap,100,32)])<0)inside+=.5;return inside;};
assert(waist(4)>waist(10)&&waist(10)>waist(14),'The neck thins as the pills separate, instead of a straight-sided stem');
assert.equal(waist(20),0,'Past the blend reach the neck has snapped');

// The outline is a single closed, smooth path per lobe: no stacked sub-paths for the rim stroke to outline.
const fused=liquidOutline([pill(0,200),pill(212,100,32),{x:20,y:-300,width:160,height:286,radius:24,blend:32,moving:true}]);
assert.equal(loops(fused),1,'Bar, pill and a popover just above the bar read as one fused shape');
// A popover spanning both pills encloses the gap between them: even-odd keeps that as a true hole.
assert.equal(loops(liquidOutline([pill(0,200),pill(212,100,32),{x:20,y:-300,width:260,height:286,radius:24,blend:32,moving:true}])),2,'An enclosed gap is traced as an inner loop');
assert(/^M [\d.-]+ [\d.-]+ Q/.test(fused)&&fused.trim().endsWith('Z'),'Smooth quadratic curves, closed');

// Blend timing: zero at both ends, full mid-motion, shrinking from the pinch point.
assert.equal(liquidBlend(1,LIQUID_DEFAULTS),0,'Settled pieces are crisp');assert.equal(liquidBlend(0,LIQUID_DEFAULTS),LIQUID_DEFAULTS.blend,'An emerging piece is fully liquid');
assert(liquidBlend(.4,LIQUID_DEFAULTS)>liquidBlend(.9,LIQUID_DEFAULTS),'The blend shrinks after the pinch point so necks snap before rest');
assert.equal(liquidBlend(.5,{blend:0,pinch:.6}),0,'Liquid blend 0 restores the analytic outline');
assert.equal(splitBlend(0,LIQUID_DEFAULTS),0);assert(splitBlend(.2,LIQUID_DEFAULTS)>splitBlend(.8,LIQUID_DEFAULTS),'A split starts fused and pinches as it parts');

// The dock maps onto shapes: main first, then the context pill with its own blend.
const metrics={main:252,context:120,gap:12,height:48,radius:24};
const shapes=dockLiquidShapes({shape:dockGeometry(.5,metrics),phase:.5,metrics});
assert.equal(shapes.length,2);assert.equal(shapes[0].blend,0,'The main pill anchors the union');assert(shapes[1].blend>0,'The context pill flows mid-split');
const settled=dockLiquidShapes({shape:dockGeometry(1,metrics),phase:1,metrics});assert.equal(settled[1].blend,0,'Settled pills are crisp');assert(!needsLiquid(settled),'Settled dock uses the analytic outline');
// A sliver rising from the bar blends as a dome scaled to its size, so it never shows as a flat lip.
const sliver=dockLiquidShapes({shape:dockGeometry(.02,metrics),phase:.02,metrics})[1];assert(sliver.blend<=2.5*Math.min(sliver.width,sliver.height)+1e-9,'Small pieces blend in proportion to their size');
const flat=liquidOutline([pill(0,300),{x:120,y:-3,width:40,height:4,radius:2,blend:Math.min(28,2.5*4),moving:true}]);assert(flat&&loops(flat)===1,'A 4px sliver fuses into the bar as one smooth dome');

// Cost: a full dock-plus-menu frame stays well within a frame budget.
// Fastest of five batches, so a busy machine (other test runs) cannot fail the budget by itself.
const batch=()=>{const started=performance.now();for(let i=0;i<10;i++)liquidOutline([pill(0,520),{...pill(-120,108,30),moving:true},{x:0,y:-500,width:330,height:486,radius:24,blend:30,moving:true}]);return (performance.now()-started)/10;};
const perFrame=Math.min(...Array.from({length:5},batch));// Budget is one 60fps frame: about 4.5ms on an idle laptop, about 10ms when other test runs load the machine.
assert(perFrame<16,`Contour per frame ${perFrame.toFixed(2)}ms`);
console.log(`Liquid contour passed: field, fuse/pinch, thinning neck, one closed path, blend timing, dock mapping, ${perFrame.toFixed(1)}ms/frame.`);
