import fs from 'node:fs/promises';

// Preserve the authored cascade while serving one render-blocking CSS request.
export const clientStyles=['tokens.css','page-boot.css','style.css','surface-hover.css','design-system.css','spatial-navigation.css','hero-timeline.css','home-about.css','about-page.css','about-illustrations.css','card-gallery.css','card-world.css','card-sphere.css','home-sections.css','project-media-focus.css','article.css','badge.css','project-menu-preview.css','preview-morph.css','hero-carousel.css','portfolio-assistant.css','glass-utility.css','iconiq-chat-effects.css','content-widths.css','menu-controls.css','composer-controls.css','composer-context.css','status-stack.css','contextual-popovers.css','glass-style.css','assistant-floating.css','assistant-fit.css','lab.css','project-backdrop.css','home-overview.css','mobile.css'];
export async function buildClientStyles(){
 const styles=await Promise.all(clientStyles.map(file=>fs.readFile(new URL('../dist/'+file,import.meta.url),'utf8')));
 await fs.writeFile(new URL('../dist/site.css',import.meta.url),styles.map((style,index)=>`/* ${clientStyles[index]} */\n${style}`).join('\n'));
}
