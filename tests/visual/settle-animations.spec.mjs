import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Diagnostic: every animation/transition running around each landing, to find what fades over the clip.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
const watch=()=>{window.__anims=[];const t0=performance.now();const tick=()=>{for(const a of document.getAnimations()){const t=a.effect?.target,name=a.transitionProperty||a.animationName||(a.effect?.getKeyframes?.().map(k=>Object.keys(k).filter(x=>!['offset','easing','composite','computedOffset'].includes(x)).join('/')).join('|'))||'waapi';window.__anims.push([Math.round(performance.now()-t0),(t?.className?.baseVal??t?.className??t?.tagName??'').toString().slice(0,50),t?.tagName,name,a.playState]);}if(!window.__stopAnims)requestAnimationFrame(tick);};requestAnimationFrame(tick);};
test('animations around landing',async({page},info)=>{
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 const card=page.locator(CENTRED);await expect(card.locator('.visual.video-preview-playing')).toBeVisible({timeout:15000});
 const link=card.locator('[data-content-card]').first(),id=await link.getAttribute('data-content-card');
 await page.evaluate(`(${watch})()`);await link.click();await expect(page).toHaveURL(new RegExp(`#${id}$`));await page.waitForTimeout(1500);
 const opening=await page.evaluate(()=>{window.__stopAnims=true;return window.__anims;});
 await page.evaluate(`window.__stopAnims=false;(${watch})()`);await page.keyboard.press('Escape');await page.waitForTimeout(1500);
 const closing=await page.evaluate(()=>{window.__stopAnims=true;return window.__anims;});
 await writeFile(info.outputPath('anims.json'),JSON.stringify({opening,closing}));
});
