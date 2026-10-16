import {test,expect} from '@playwright/test';

const role='Review this senior product design role: '+('Research, complex workflows, prototyping and collaboration. '.repeat(90));
const review='Overall fit\nRelevant product and prototyping experience.\n\nStrongest matches\nMerlin: generative interfaces and a component-based workbench.\n\nTransferable experience\nPorter shows the same systems thinking across a different product context.\n\nRecommended projects to review\nMerlin and Porter.';

for(const mobile of [true,false])test.describe(mobile?'mobile review':'desktop review',()=>{
 test.use({viewport:mobile?{width:393,height:851}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 test('full pasted role renders with evidence and survives reload',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));let question='';
  await page.route('**/api/assistant',async route=>{
   question=route.request().postDataJSON().question;
   await route.fulfill({json:{text:review,kind:'job-fit',documentIds:['merlin','porter'],knowledgeSources:[],suggestions:[],speechToken:null}});
  });
  await page.goto('/#assistant');await expect(page.locator('#askInput')).toHaveAttribute('maxlength','12000');
  await page.locator('#askInput').fill(role);await page.locator('#assistantAction').click();
  await expect(page.locator('.ask-response-lead p').last()).toHaveText(review);
  await expect(page.locator('#askPage')).not.toHaveAttribute('aria-busy','true');
  expect(question).toBe(role.trim());await expect(page.locator('.ask-cards [data-content-card="merlin"]')).toHaveCount(1);await expect(page.locator('.ask-cards [data-content-card="porter"]')).toHaveCount(1);
  await page.reload();await expect(page.locator('.ask-user').last()).toHaveText(role.trim());await expect(page.locator('.ask-response-lead p').last()).toHaveText(review);expect(errors).toEqual([]);
 });
 test('service failure is not presented as missing experience',async({page})=>{
  await page.route('**/api/assistant',route=>route.fulfill({status:503,json:{error:'ai_not_configured',text:'Your pasted text has not been evaluated.',documentIds:[],knowledgeSources:[],suggestions:[],responseMode:'published-fallback',speechToken:null}}));
  await page.goto('/#assistant');await page.locator('#askInput').fill(role);await page.locator('#assistantAction').click();
  const notice='AI is temporarily unavailable; this is a published-content fallback, not a new AI evaluation.';
  await expect(page.locator('.ask-service-notice').last()).toHaveText(notice);
  await expect(page.locator('#askPage')).not.toHaveAttribute('aria-busy','true');await page.reload();await expect(page.locator('.ask-service-notice').last()).toHaveText(notice);
 });
});
