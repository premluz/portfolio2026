import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Preserve the authored cascade while serving one render-blocking CSS request.
export const clientStyles=['tokens.css','style.css','surface-hover.css','design-system.css','spatial-navigation.css','hero-timeline.css','home-about.css','card-gallery.css','home-sections.css','project-media-focus.css','project-menu-preview.css','hero-carousel.css','portfolio-assistant.css','glass-utility.css','iconiq-chat-effects.css','content-widths.css','menu-controls.css','composer-controls.css','composer-context.css','status-stack.css','contextual-popovers.css','mobile.css'];
export async function buildClientStyles(){
 const styles=await Promise.all(clientStyles.map(file=>fs.readFile(new URL('../dist/'+file,import.meta.url),'utf8')));
 const css=styles.map((style,index)=>`/* ${clientStyles[index]} */\n${style}`).join('\n');
 await fs.writeFile(new URL('../dist/site.css',import.meta.url),css);
 return css;
}
export function versionClientStyles(html,css){
 const stylesheet='href="site.css"';
 if(!html.includes(stylesheet))throw new Error('Cannot version CSS: authored HTML is missing the site.css stylesheet link.');
 const version=createHash('sha256').update(css).digest('hex');
 return html.replace(stylesheet,`href="site.css?v=${version}"`);
}
