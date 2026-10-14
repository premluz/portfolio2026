// Hover trails must not interpolate yesterday's palette against today's page.
// Commit all theme tokens and control states before restoring transitions.
export function commitThemeChange(root,update){
 root.classList.add('theme-changing');
 try{update();void root.offsetWidth;}
 finally{root.classList.remove('theme-changing');}
}
