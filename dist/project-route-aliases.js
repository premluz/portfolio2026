const legacyProjectRoutes=new Map([['#planner','#rios'],['#planner-02','#rios-02']]);

export function mountProjectRouteAliases(target){
 const normalize=()=>{
  const route=legacyProjectRoutes.get(target.location.hash);
  if(route)target.history.replaceState(target.history.state,'',route);
 };
 // Normalize before the main router reads either the initial URL or a hash change.
 normalize();
 target.addEventListener('hashchange',normalize);
 return ()=>target.removeEventListener('hashchange',normalize);
}
