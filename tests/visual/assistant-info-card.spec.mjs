import {test,expect} from '@playwright/test';

// An answer may cite an information page (About) beside projects. Its card has no media, so mounting the
// answer's card effects must not assume an image frame: a throw there failed the answer and left the next
// project navigation stuck half-way, with the page inert.
test('an answer with an info card renders, and its project cards still open',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/assistant',route=>route.fulfill({json:{text:'Prem is a product designer and creative technologist.',documentIds:['merlin','rios','about'],knowledgeSources:[{id:'about-prem'}],suggestions:[],speechToken:null}}));
 await page.goto('/');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.fill('#askInput','Who is Prem');await page.press('#askInput','Enter');
 const answer=page.locator('#askMessages .ask-response').last();
 await expect(answer.locator('.ask-cards .info-card[data-content-card="about"]')).toBeVisible();
 await expect(page.locator('#askMessages .ask-assistant'),'the answer renders without the failure message').toHaveCount(0);
 await answer.locator('.project-card[data-content-card="rios"]').click();
 await expect(page).toHaveURL(/#rios$/);
 await expect(page.locator('html')).not.toHaveClass(/route-transition/,{timeout:5000});
 await expect(page.locator('body')).not.toHaveClass(/in-motion/);
 await page.keyboard.press('Escape');await expect(page).not.toHaveURL(/#rios$/);
 expect(errors,'no page errors').toEqual([]);
});
