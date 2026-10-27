export const APP_MAX_WIDTH=1920;
export const CONTENT_WIDTHS=Object.freeze({xsmall:740,small:1200,medium:1440,large:1760});
export const SECTION_SPANS=Object.freeze(['content','app','edge']);
export const normaliseContentWidth=value=>Object.hasOwn(CONTENT_WIDTHS,value)?value:'medium';
export const normaliseSectionSpan=value=>SECTION_SPANS.includes(value)?value:'content';
export const responsiveContentGutter=viewport=>Math.max(24,Math.min(64,viewport*.04));
export function readContentWidth(storage,scope){
 try{
  const contentPage=scope==='content'||scope==='about';
  const key=scope==='home'?'prem-home-content-width':contentPage?'prem-content-page-width':'prem-detail-content-width';
  const saved=storage?.getItem(key);
  if(contentPage&&saved==null)return 'medium';
  if(saved!==null&&saved!==undefined)return normaliseContentWidth(saved);
  return storage?.getItem(scope==='home'?'prem-portfolio-full-width':'prem-detail-full-width')==='true'?'large':'medium';
 }catch{return 'medium';}
}
export const pageTemplateForRoute=(route,projectIds=[])=>route==='work'?'home':projectIds.includes(route)?'project-details':'content';
export function contentRail(viewport,preset='medium',gutter=64){
 const app=Math.min(APP_MAX_WIDTH,Math.max(0,viewport)),padding=Math.min(Math.max(0,gutter),app/2);
 const shell=Math.min(app,CONTENT_WIDTHS[normaliseContentWidth(preset)]+padding*2);
 return {app,shell,content:Math.max(0,shell-padding*2),gutter:padding};
}
export function sectionRail(rail,span='content'){
 const mode=normaliseSectionSpan(span),width=mode==='edge'?rail.app:mode==='app'?Math.max(0,rail.app-rail.gutter*2):rail.content;
 return {width,offset:(rail.content-width)/2};
}
