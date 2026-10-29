import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [design,controls,plain,styles,tokens]=await Promise.all([
  readFile(new URL('../dist/design-system.css',import.meta.url),'utf8'),
  readFile(new URL('../dist/control-style.css',import.meta.url),'utf8'),
  readFile(new URL('../dist/plain-nav.css',import.meta.url),'utf8'),
  readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8'),
  readFile(new URL('../dist/tokens.css',import.meta.url),'utf8')
]);

assert(styles.includes("'design-system.css'"),'The shared press rules ship in the client bundle');
for(const selector of ['nav a','.context-nav button','.site-settings-toggle','.project-menu button','.header-detail-nav button','.project-card'])assert(design.includes(selector),`Press feedback covers ${selector}`);
assert(/\.project-card\{[^}]*transform-origin:center/.test(design),'Card press feedback scales from the visual center');
assert(tokens.includes('--card-hover-scale: .985'),'Cards have a named slight hover scale');
assert(tokens.includes('--card-press-scale: .97'),'Cards have a softer named press scale');
const hoverScale=Number(tokens.match(/--card-hover-scale:\s*([\d.]+)/)?.[1]);
const pressScale=Number(tokens.match(/--card-press-scale:\s*([\d.]+)/)?.[1]);
assert(pressScale<hoverScale&&pressScale>.92,'Card press is deeper than hover without using the firmer glass-button scale');
assert(design.includes('.project-card:hover:not(:active){transform:scale(var(--card-hover-scale))'),'Cards press slightly on hover');
assert(design.includes('.project-card:active{transform:scale(var(--card-press-scale))'),'Cards press further with their softer scale');
assert(design.includes('.project-card:hover:not(:active){transform:none}'),'Card hover press is disabled for reduced motion');
for(const token of ['var(--glass-button-press-scale)','var(--glass-button-press-duration)','var(--glass-button-press-in-duration)','var(--glass-button-press-ease)'])assert(controls.includes(token),`Press feedback uses ${token}`);
assert(!/transition\s*:\s*all/.test(design),'Press feedback does not use transition: all');
assert(design.includes('@media(prefers-reduced-motion:reduce)')&&design.includes(':root[data-animation="off"]'),'Press feedback respects motion preferences');
assert(controls.includes('.control-item')&&controls.includes(':active:not(:disabled)'),'Composer and navigation items share the control press interaction');
assert(plain.includes('nav a')&&plain.includes('.control-ghost')&&controls.includes('.control-surface'),'Ghost navigation and standalone controls share the same system');
console.log('Press feedback passed: composer tokens are shared by dock navigation, plain navigation, detail navigation and project cards.');
