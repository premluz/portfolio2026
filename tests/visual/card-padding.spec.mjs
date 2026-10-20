import {test,expect} from '@playwright/test';
import {settingsRevision} from '../../dist/published-settings.js';

// Card padding in the developer settings frames carousel media the same way it insets grid cards.
const CENTRED='[data-home-product-gallery] [data-gallery-item][aria-current="true"]';
const insets=async page=>page.evaluate(selector=>{
 const card=document.querySelector(selector+' .project-card'),visual=card.querySelector('.visual'),a=card.getBoundingClientRect(),b=visual.getBoundingClientRect();
 return {left:Math.round(b.left-a.left),top:Math.round(b.top-a.top),right:Math.round(a.right-b.right),bottom:Math.round(a.bottom-b.bottom)};
},CENTRED);

test('card padding settings inset carousel media',async({page})=>{
 // Without the published preset, the carousel keeps its caption outside the card, so the media alone fills it.
 await page.addInitScript(revision=>localStorage.setItem('prem-site-settings-revision',revision),settingsRevision);
 await page.goto('/?dev=1');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#settingsToggle').click();
 const setUniform=async value=>{await page.evaluate(next=>{const input=document.getElementById('cardPaddingAll');input.value=String(next);input.dispatchEvent(new Event('input',{bubbles:true}));},value);await page.waitForTimeout(400);};
 await setUniform(0);
 const none=await insets(page);
 expect(Object.values(none).every(value=>value<=1),`no padding: ${JSON.stringify(none)}`).toBe(true);
 await setUniform(48);
 const wide=await insets(page);
 for(const side of ['left','top','right','bottom'])expect(Math.abs(wide[side]-48),`${side} inset follows the slider: ${JSON.stringify(wide)}`).toBeLessThanOrEqual(2);
});
