import {ProjectMenuPreview} from './project-menu-preview.js';
import {installProjectMenuHover} from './project-menu-hover.js';
// One recipe for generous, layout-neutral list hit areas and project previews.
export function mountTextListHover(root,projects,{reduced=()=>false}={}){
 const controllers=[...root.querySelectorAll('.home-product-text,.home-about-list-content')].map(section=>{
  const preview=new ProjectMenuPreview(section,projects,{reduced,anchor:row=>row.querySelector('.home-about-item,.home-product-text a>span')||row,placement:'right',gap:24,size:{width:360,height:260}});
  const disposers=[...section.querySelectorAll('ul')].map(list=>installProjectMenuHover(list,{reduced,onHover:row=>preview.show(row),onLeave:()=>preview.hide()}));
  return {hide:()=>preview.hide(),destroy:()=>{disposers.forEach(dispose=>dispose());preview.destroy();}};
 });
 return {hide:()=>controllers.forEach(controller=>controller.hide()),destroy:()=>controllers.forEach(controller=>controller.destroy())};
}
