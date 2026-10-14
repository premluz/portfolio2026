import {content} from './content/local.js';
// Compatibility view for the existing motion/layout system. Canonical content is
// authored once in content/catalog.json; card placements keep their own DOM IDs.
const homeCards=content.getLayoutCards('home');
const textOnlyProjects=content.list({type:'portfolio-item'}).filter(document=>document.listOnly===true).map(document=>content.getCard(document.id));
export const cards=[...homeCards,...textOnlyProjects];
export const homeProjects=homeCards.filter(card=>card._type==='portfolio');
export const projects=[...homeProjects.filter(card=>!card.sourceProjectId),...textOnlyProjects];
export const informationCards=cards.filter(card=>card._type==='information');
export const cardIds=cards.map(card=>card.id);
export const projectIds=projects.map(project=>project.id);
export const getDocument=id=>cards.find(card=>card.id===id);
export {content};
