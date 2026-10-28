import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL(name.startsWith('scripts/')?'../'+name:'../dist/'+name,import.meta.url),'utf8');
const [tokens,design,empty,index,styles]=await Promise.all(['tokens.css','design-system.css','empty-hero.css','index.html','scripts/client-styles.mjs'].map(read));

// One offset token lowers the header, the top navigation and the hero's start together.
assert(/--header-top-offset: clamp\([^;]+\);/.test(tokens),'The offset is a token');
assert(tokens.includes('--header-total: calc(var(--header-height) + var(--header-top-offset));'),'The total header space includes it');
assert(tokens.includes('--dock-top: calc((var(--header-height) - var(--nav-height)) / 2 + var(--header-top-offset));'),'The top navigation sits lower by the same amount');
assert(design.includes('header{height:var(--header-total);padding-top:var(--header-top-offset)}'),'The header is taller by padding, so its content moves down');
assert(tokens.includes('--page-content-top: calc((var(--header-height) + var(--brand-avatar-size)) / 2 + var(--header-top-offset) + var(--hero-gap));'),'Page content starts below the header content');
assert(design.includes('padding-top:var(--page-content-top);padding-bottom:0}')&&design.includes('>.detail{margin-top:0;padding-top:var(--page-content-top);padding-inline:0}'),'The hero, About and a project detail all start at that offset');
assert(design.includes('top:calc(var(--header-total) + var(--space-10))'),'The sticky split hero clears the taller header');

// The role line sits under the name, in the markup the hide-logo setting already hides.
assert(index.includes('<span class="discipline"><span class="brand-name">Prem Luczak</span><span class="brand-role">Product designer &amp; builder</span></span>'),'The page shows the role under the name');
const role=design.match(/\.brand-role\{[^}]*\}/)?.[0]||'';
assert(role&&!role.includes('font-size'),'The role has no size of its own: it matches the name');

// Empty hero: only with the carousel showing and no visible hero content, Current layout only, and the carousel takes over the header margin.
assert(styles.includes("'empty-hero.css'"),'The stylesheet ships in the bundle');
const rules=empty.split('\n').filter(line=>line.startsWith('main:'));
assert.equal(rules.length,2);
for(const rule of rules)for(const part of ['main:not(.home-view-split)','.home-product-carousel:not([hidden])',':not(:has(.hero-about>:is(.badge,h1,.hero-strapline):not([hidden])))',':not(:has(.hero-copy>*))',':not(:has(.home-overview:not([hidden])))'])assert(rule.includes(part),`Rule requires ${part}`);
assert(rules[0].endsWith('>.home-hero{display:none}'));
assert(rules[1].includes('margin-top:var(--header-total);min-height:calc(100svh - var(--header-total));display:grid;align-content:center;padding-bottom:calc(2 * var(--empty-hero-lift))'),'The carousel is centred below the header, lifted slightly');
assert(/--empty-hero-lift: clamp\([^;]+\);/.test(tokens),'The lift is a token');
// Top nav on a project or article page: the header's avatar and name give way to Go Back and Previous/Next, in one fade.
{const app=await read('app.js');
assert(index.includes('<nav class="header-detail-nav" id="headerDetailNav" aria-label="Page navigation" aria-hidden="true" inert><button type="button" data-header-action="back">Go Back</button>'),'The header holds Go Back and Previous/Next, hidden until needed');
assert(app.includes("const headerDetail=route=>navPosition==='top'&&(projectIds.includes(route)||articleIds.includes(route));"),'Only with the nav on top, on a project or article page');
assert(app.includes('dockMorph.setBack(!composer&&showBackControl(route)&&!headerDetail(route),options);'),'The dock does not repeat Back while the header holds it');
assert(design.includes(':root.header-detail-active header :is(.brand,.discipline){opacity:0;transform:translateX(calc(-1 * var(--header-swap-shift)));')&&design.includes(':root.header-detail-active .header-detail-nav button{opacity:1;transform:none}'),'The avatar and name slide out left as the controls slide in');
assert(design.includes('header .brand{--swap-in:0;--swap-out:4}')&&design.includes('.header-detail-nav [data-header-action="next"]{--swap-in:4;--swap-out:0}'),'One staggered order in, the reverse order out');
assert(tokens.includes('--header-swap-duration: 240ms;')&&tokens.includes('--header-swap-step: 60ms;'),'Each element takes 240ms, 60ms after the one before');
assert(design.includes('#dock nav a{display:inline-flex;align-items:center;box-sizing:border-box;height:var(--nav-icon-size);font-size:var(--font-size-body);font-weight:var(--font-weight-body);letter-spacing:var(--letter-spacing-body);'),'Menu links are body text, like the name in the header');}
assert(design.includes('.project-card .project-summary,.surface.detail>.project-summary{max-width:58ch;margin:0;'),'A card\'s results line follows its title at regular line spacing');
assert(design.includes('.brand-role{color:var(--eyebrow-ink)}'),'The role under the name is quieter than the name');
{const plainCss=await read('plain-nav.css');
assert(tokens.includes('--nav-link-ink: oklch(.58 .01 300);')&&tokens.includes('--nav-link-ink: oklch(.68 .006 304);')&&tokens.includes('--nav-link-active-ink: var(--muted);'),'Menu links have their own quieter idle and current tones, in both themes');
assert(design.includes('.dock-morph nav a:not(.active){color:var(--nav-link-ink)}')&&design.includes('.dock-morph nav a.active{background:var(--nav-active);color:var(--nav-link-active-ink)}')&&design.includes('.dock-morph nav a.active:is(:hover,:focus-visible,.hover-trail){color:var(--ink)}'),'Glass menu: idle and current are quieter, hover (even on the current page) is unchanged');
assert(plainCss.includes('nav a.active{color:var(--nav-link-active-ink)!important;')&&plainCss.includes('nav a.active:is(:hover,:focus-visible){color:var(--ink)!important}'),'Plain menu: the same, with the underline on the current page');}
{const assistantCss=await read('portfolio-assistant.css'),contentCss=await read('content-widths.css'),aboutCss=await read('about-page.css');
assert(tokens.includes('--page-intro-width: 50%;'),'Titles and their text share a half-width block');
assert(contentCss.includes('.hero-about h1{max-width:var(--page-intro-width)}')&&contentCss.includes('grid-column:calc(2 * var(--content-column-start) - 1) / span 3;'),'Home: the title and its text are half the width, the text starting on the first or second third');
assert(aboutCss.includes('grid-template-columns:minmax(0,var(--page-intro-width)) minmax(0,1fr)')&&aboutCss.includes('.lab-heading{max-width:var(--page-intro-width)}')&&aboutCss.includes('.surface.detail.info-detail:not(.about-detail)>h1+.info-body{max-width:var(--page-intro-width)}'),'About, the Lab and Contact use the same block');
assert(assistantCss.includes(':root[data-nav-position="top"] #dock{left:auto;right:calc((100vw - min(100vw, var(--content-shell-width))) / 2 + var(--content-gutter));transform:none}'),'With the nav on top the menu is right-aligned to the content edge');
assert(assistantCss.includes(':root[data-nav-position="top"][data-plain-nav="on"] #dock:not(.is-composer){right:calc('),'Plain navigation lines the last link\'s text up with the content edge');}
{const aboutCss=await read('home-about.css'),articleCss=await read('article.css');
assert(aboutCss.includes('.home-about h2{max-width:var(--page-intro-width);margin:0;font-size:var(--heading-title-size);')&&aboutCss.includes('.home-about-copy p{grid-column:calc(2 * var(--content-column-start) - 1) / span 3;margin:0;max-width:none;'),'The About block: heading at body size, text in the half-width block');
assert(aboutCss.includes('.home-about-how h3{grid-column:var(--content-column-start) / span 2;margin:0 0 var(--space-4);font-size:var(--heading-label-size);')&&aboutCss.includes('.home-about-list h3{margin:0 0 var(--space-6);font-size:var(--heading-label-size);'),'How I work, Experience and Side Projects labels follow the heading style');
assert(articleCss.includes('.article-section h2{margin:var(--space-page-rhythm-sm) 0 var(--space-4);font-size:var(--heading-article-size);')&&articleCss.includes('.article-series{max-width:var(--content-width-reading);'),'Blog headings follow the heading style; the series line is body text');}
{const read2=async f=>(await readFile(new URL('../dist/'+f,import.meta.url),'utf8'));
const [tk,ds,hs,ha,ar,lb,pa,ap,cg,app,hp,tr,df]=await Promise.all(['tokens.css','design-system.css','home-sections.css','home-about.css','article.css','lab.css','portfolio-assistant.css','about-page.css','card-gallery.css','app.js','index.html','settings-transfer.js','default-settings.js'].map(read2));
assert(tk.includes('--heading-title-size: var(--font-size-body);')&&tk.includes(':root[data-heading-style="editorial"]{')&&tk.includes('--heading-title-size: var(--font-size-home-heading);')&&tk.includes('--heading-label-transform: uppercase;'),'Heading style: body size by default, one editorial variant');
const titleRules=[[ds,'.hero-about h1,.surface.detail h1{font-size:var(--heading-title-size)'],[ds,'.site-footer h2{font-size:var(--heading-title-size)'],[hs,'.home-content-section>h2{margin:0 0 var(--space-6);font-size:var(--heading-title-size)'],[hs,'.home-approach-intro h2{grid-column:1 / -1;margin:0 0 var(--space-6);font-size:var(--heading-title-size)'],[lb,'.lab-heading h1{margin:0;font-size:var(--heading-title-size)'],[ar,'.surface.detail .article-header h1{margin:0;font-size:var(--heading-title-size)'],[pa,'font-size:var(--heading-title-size)'],[ap,'.about-section>h2{max-width:27ch;margin:0;font-size:var(--heading-title-size)'],[cg,'.card-gallery-block>h2{font-size:var(--heading-title-size)'],[ha,'.home-about h2{max-width:var(--page-intro-width);margin:0;font-size:var(--heading-title-size)']];
for(const [src,text] of titleRules)assert(src.includes(text),'Every title and section heading reads the heading tokens: '+text.slice(0,50));
assert(ha.includes('.home-about-how h3{')&&ha.includes('text-transform:var(--heading-label-transform)')&&ha.includes('color:var(--heading-label-color)')&&ar.includes('.article-section h2{margin:var(--space-page-rhythm-sm) 0 var(--space-4);font-size:var(--heading-article-size)'),'Section labels and blog headings follow the switch too');
assert(hp.includes('<input id="editorialHeadings" type="checkbox"> Editorial headings')&&hp.indexOf('id="editorialHeadings"')>hp.indexOf('data-settings-slot="design-system"'),'The switch lives in the Design system group, unchecked (body size)');
assert(app.includes("document.documentElement.dataset.headingStyle=editorialHeadings?'editorial':'body';")&&tr.includes("editorialHeadings:'prem-editorial-headings'")&&df.includes("'prem-editorial-headings':'false'"),'The choice is applied, saved and exported');
assert(hp.includes('<input id="contactTitle" type="checkbox"> Contact page: show title')&&ap.includes(':root.contact-title-hidden [data-info-page="contact"]>h1{display:none}')&&df.includes("'prem-contact-title':'false'"),'Contact has a show-title switch that starts off');
assert(!hp.includes('articleTitleBody')&&!tr.includes('article-title-body')&&!df.includes('article-title-body'),'The article-only title size switch is gone');}
assert((await readFile(new URL('../dist/home-about.css',import.meta.url),'utf8')).includes('.home-about-copy{margin-top:var(--space-4)}'),'The home About intro text sits one tight step (19.2px) under its heading');
console.log('Header spacing passed: one offset token for header, nav and hero, role under the name, empty-hero centring scoped and header-aware.');
