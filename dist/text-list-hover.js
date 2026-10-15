import {ProjectMenuPreview} from './project-menu-preview.js';
import {installProjectMenuHover} from './project-menu-hover.js';
import {projects as publishedProjects} from './documents.js';
// One recipe for generous, layout-neutral list hit areas and project previews.
// Shared with the thumbnail morph so a return lands exactly where the hover preview appears.
export const TEXT_LIST_PREVIEW_ANCHOR='.home-about-item,.home-product-text a>span';
export function mountTextListHover(root,projects,{reduced=()=>false}={}){
 const previewProjects=[...new Map([...publishedProjects,...projects].map(project=>[project.id,project])).values()];
 const controllers=[...root.querySelectorAll('.home-product-text,.home-about-list-content')].map(section=>{
  const preview=new ProjectMenuPreview(section,previewProjects,{reduced,anchor:row=>row.querySelector(TEXT_LIST_PREVIEW_ANCHOR)||row,placement:'left'});
  const disposers=[...section.querySelectorAll('ul')].map(list=>installProjectMenuHover(list,{reduced,onHover:row=>preview.show(row),onLeave:()=>preview.hide()}));
  return {hide:()=>preview.hide(),destroy:()=>{disposers.forEach(dispose=>dispose());preview.destroy();}};
 });
 return {hide:()=>controllers.forEach(controller=>controller.hide()),destroy:()=>controllers.forEach(controller=>controller.destroy())};
}
