import {test,expect} from '@playwright/test';

// Every developer settings group is visible and the panel loads without errors.
test('developer settings panel lists every group',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto('/?dev=1');await expect(page.locator('html')).not.toHaveClass(/page-booting/);
 await page.locator('#settingsToggle').click();
 const groups=await page.locator('#settings .developer-settings-group>summary').evaluateAll(nodes=>nodes.map(node=>({name:node.textContent.trim(),visible:!!node.offsetParent})));
 expect(groups.filter(group=>!group.visible),'hidden groups').toEqual([]);
 expect(groups.map(group=>group.name)).toContain('Navigation');
 expect(errors).toEqual([]);
});
