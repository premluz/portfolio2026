import assert from 'node:assert/strict';
import {colorChannels,colorInterpolator,oklchChannels,gradientInterpolator} from '../dist/surface-colors.js';
const near=(actual,expected,tolerance=.05)=>actual.forEach((value,index)=>assert.ok(Math.abs(value-expected[index])<=tolerance,`${actual} ≈ ${expected}`));
near(colorChannels('rgb(240, 240, 239)'),[240,240,239,1]);
near(colorChannels('rgb(100% 50% 0% / 45%)'),[255,127.5,0,.45]);
near(colorChannels('color(srgb 0.2 0.4 0.6 / 0.45)'),[51,102,153,.45]);
near(colorChannels('color(srgb-linear 0.21404114 0.21404114 0.21404114)'),[127.5,127.5,127.5,1]);
near(colorChannels('color(display-p3 1 1 1 / .6)'),[255,255,255,.6]);
near(colorChannels('oklab(1 0 0)'),[255,255,255,1]);
near(colorChannels('oklab(0.6279553606 0.2248630611 0.1258462985)'),[255,0,0,1]);
// WPT CSS Color 4 reference: oklab(70% -0.1 0) -> rgb(29.264% 70.096% 63.017%).
near(colorChannels('oklab(70% -0.1 0)'),[74.6232,178.7448,160.69335,1]);
near(colorChannels('oklch(70% .1 180)'),colorChannels('oklab(70% -.1 0)'));
near(colorChannels('oklab(.95 2e-4 -1e-4)'),colorChannels('oklab(.95 .0002 -.0001)'));
// Clicking partway through a light hover must never produce near-black fill.
const light=colorInterpolator('oklab(.953 0.002 -0.001)','rgb(240,240,239)');
for(let step=0;step<=20;step++)assert.ok(colorChannels(light(step/20)).slice(0,3).every(value=>value>230));
const fade=colorInterpolator('rgba(240,240,239,1)','transparent');
for(const progress of [0,.25,.5,.75,.25,0])near(colorChannels(fade(progress)),[240,240,239,1-progress]);
near(colorChannels(fade(1)),[0,0,0,0]);
near(colorChannels(colorInterpolator('unsupported(1 2 3)','rgb(240,240,239)')(.5)),[240,240,239,1]);
console.log('Surface colors passed: modern CSS hover colors, signed channels, light morphs, transparency and reversal.');

// Independently known Oklab vectors and authored hex colours round-trip.
near(oklchChannels('#ff0000'),[.6279553606,.2576833077,29.233885,1],.0001);
near(oklchChannels('#ffffff'),[1,0,0,1],.0001);
for(const hex of ['#050506','#0d0d0f','#f8f8f7','#f0f0ef','#24212b','#f6f4ff']){
 const [l,c,h,a]=oklchChannels(hex);near(colorChannels(`oklch(${l} ${c} ${h} / ${a})`),colorChannels(hex),.001);
}
const gradientColors=gradient=>gradient.match(/rgba\([^)]*\)/g).map(colorChannels);
const a=['oklch(.925 .048 265)','oklch(.968 .009 310)'];
const b=['oklch(.27 .031 265)','oklch(.145 .006 310)'];
const blend=gradientInterpolator(`linear-gradient(180deg in oklab,${a})`,`linear-gradient(180deg in oklab,${b})`);
gradientColors(blend(0)).forEach((color,i)=>near(color,colorChannels(a[i])));
gradientColors(blend(1)).forEach((color,i)=>near(color,colorChannels(b[i])));
assert.notDeepEqual(...gradientColors(blend(1)),'Dark mode retains two distinct hue stops');
const clear=gradientInterpolator(`linear-gradient(180deg,${a})`,'none','transparent','transparent');
gradientColors(clear(.5)).forEach((color,i)=>near(color,[...colorChannels(a[i]).slice(0,3),.5]));
const neutral=gradientInterpolator('none',`linear-gradient(180deg,${a})`,'rgb(240,240,239)');
gradientColors(neutral(0)).forEach(color=>near(color,[240,240,239,1]));
console.log('OKLCH palette and gradients passed: known conversion vectors, both stops retained, neutral fallback and alpha-safe fading.');
