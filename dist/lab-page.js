import {escapeText} from './content/html.js';

// The Lab's page heading. The Lab has no catalog document (ADR-011), so its words live here; it reads like the
// About and Contact headings: a title, an eyebrow and one line.
export const LAB_HEADING=Object.freeze({title:'Experiments',eyebrow:'Work in progress',summary:'Prototypes, R&D and projects that never made it to market.'});

export const labHeadingMarkup=(heading=LAB_HEADING)=>`<section class="lab-heading" aria-labelledby="labTitle"><h1 id="labTitle" tabindex="-1">${escapeText(heading.title)}</h1><p class="eyebrow">${escapeText(heading.eyebrow)}</p><p class="lab-summary">${escapeText(heading.summary)}</p></section>`;
