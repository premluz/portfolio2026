const ns='http://www.w3.org/2000/svg';
// Box-shadow insets cannot follow a clip-path, so each inner edge is carved from the outline's own
// alpha: the shape minus a shifted copy of itself leaves a band that tracks every merging lobe.
const edges=[['rim',0,1,.5],['rim',0,-1,.5],['side',1,0,.5],['side',-1,0,.5],['glow',0,4,2],['glow',0,-4,2]];
const node=(name,attributes,children=[])=>{const el=document.createElementNS(ns,name);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));el.append(...children);return el;};

export function createGlassLight(svg,defs,id){
 const filter=node('filter',{id,'color-interpolation-filters':'sRGB'});
 const results=edges.map(([tone,dx,dy,blur],index)=>{
  const edge='edge'+index;
  filter.append(
   node('feOffset',{in:'SourceAlpha',dx,dy,result:edge+'-shift'}),
   node('feComposite',{in:'SourceAlpha',in2:edge+'-shift',operator:'out',result:edge+'-band'}),
   node('feGaussianBlur',{in:edge+'-band',stdDeviation:blur,result:edge+'-soft'}),
   node('feComposite',{in:edge+'-soft',in2:'SourceAlpha',operator:'in',result:edge+'-inside'}),
   node('feFlood',{class:'dock-glass-light-'+tone,result:edge+'-tone'}),
   node('feComposite',{in:edge+'-tone',in2:edge+'-inside',operator:'in',result:edge})
  );
  return edge;
 });
 filter.append(node('feMerge',{},results.map(edge=>node('feMergeNode',{in:edge}))));
 defs.append(filter);
 const path=node('path',{class:'dock-glass-light',filter:`url(#${id})`});
 svg.append(path);
 return path;
}
