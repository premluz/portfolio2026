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
assert(aboutCss.includes('.home-about h2{max-width:var(--page-intro-width);margin:0;font-size:var(--font-size-body);')&&aboutCss.includes('.home-about-copy p{grid-column:calc(2 * var(--content-column-start) - 1) / span 3;margin:0;max-width:none;'),'The About block: heading at body size, text in the half-width block');
assert(aboutCss.includes('.home-about-how h3{grid-column:var(--content-column-start) / span 2;margin:0 0 var(--space-4);font-size:var(--font-size-body);font-weight:var(--font-weight-body);line-height:var(--line-height-body);letter-spacing:var(--letter-spacing-body);color:var(--ink)}')&&aboutCss.includes('.home-about-list h3{margin:0 0 var(--space-4);font-size:var(--font-size-body);'),'How I work, Experience and Side Projects labels are body text in full ink, not eyebrows');
assert(articleCss.includes('.article-section h2{margin:var(--space-page-rhythm-sm) 0 var(--space-4);font-size:var(--font-size-reading);')&&articleCss.includes('.article-series{max-width:var(--content-width-reading);'),'Blog headings are reading-size text in full ink; the series line is body text');}
console.log('Header spacing passed: one offset token for header, nav and hero, role under the name, empty-hero centring scoped and header-aware.');
