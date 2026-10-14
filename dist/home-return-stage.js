import {stageMotion} from './motion-viewport.js';

// Keep the live grid, its selectors and image canvases intact, but contain its
// travelling neighbours at the viewport instead of the content-width boundary.
export function stageHomeReturn(main){
 const rect=main.getBoundingClientRect(),computed=getComputedStyle(main),css=main.style.cssText;
 const sticky=[...main.querySelectorAll('.home-hero')]
  .filter(node=>getComputedStyle(node).position==='sticky')
  .map(node=>({node,rect:node.getBoundingClientRect(),css:node.style.cssText}));
 const placeholder=document.createElement('div');placeholder.className='motion-placeholder';
 placeholder.setAttribute('aria-hidden','true');placeholder.inert=true;
 Object.assign(placeholder.style,{height:rect.height+'px',width:rect.width+'px',marginInline:'auto',marginTop:computed.marginTop,marginBottom:computed.marginBottom});
 main.before(placeholder);
 Object.assign(main.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',minHeight:'0',margin:'0',overflow:'visible'});
 const removeViewport=stageMotion(main,18);
 for(const item of sticky)Object.assign(item.node.style,{position:'absolute',left:item.rect.left-rect.left+'px',top:item.rect.top-rect.top+'px',width:item.rect.width+'px',height:item.rect.height+'px',margin:'0'});
 let restored=false;
 return ()=>{
  if(restored)return;restored=true;
  main.style.cssText=css;
  for(const item of sticky)item.node.style.cssText=item.css;
  placeholder.replaceWith(main);removeViewport();
 };
}
