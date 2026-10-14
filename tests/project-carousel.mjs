import assert from 'node:assert/strict';
import {projects,projectIds,cardIds} from '../dist/documents.js';
import {adjacentCard,stepProject,cardNavigation} from '../dist/card-navigation.js';
assert(cardIds.includes('about')&&cardIds.includes('contact'),'Information pages remain routable');
for(const id of ['about','contact']){
 assert(!projectIds.includes(id),'Information pages never get project controls');
 assert.equal(adjacentCard(projects,id,1),null);assert.equal(adjacentCard(projects,id,-1),null);
 assert.equal(cardNavigation(id,projectIds[0],projectIds).kind,'morph');
 assert.equal(cardNavigation(projectIds[0],id,projectIds).kind,'morph');
 assert.equal(cardNavigation('work',id,projectIds,{slide:true}).kind,'slide','Main nav still brings information pages in from the side');
}
for(const project of projects)for(const direction of [-1,1])assert(projectIds.includes(adjacentCard(projects,project.id,direction).id));
assert.equal(adjacentCard(projects,projects.at(-1).id,1).id,projects[0].id);
assert.equal(adjacentCard(projects,projects[0].id,-1).id,projects.at(-1).id);
assert.equal(stepProject(projects,'work',1).id,projects[0].id,'Next from Work opens the first project');
assert.equal(stepProject(projects,'work',-1).id,projects.at(-1).id,'Previous from Work wraps to the last project');
assert.equal(stepProject(projects,projects[0].id,-1).id,projects.at(-1).id,'Previous from the first project still wraps');
assert.equal(stepProject(projects,'about',1),null,'Information pages stay outside the carousel');
console.log('Project carousel passed: project-only arrows/swipes, wraparound, independent information routes and main-nav slide.');
