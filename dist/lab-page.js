import {escapeText} from './content/html.js';

// The Lab's page heading. The Lab has no catalog document (ADR-011), so its words live here. It has About's
// structure (a title, then body text in `.info-body`) and shares About's styles for both.
export const LAB_HEADING=Object.freeze({title:'Experiments',summary:'Prototypes, R&D and projects that never made it to market.'});

export const labHeadingMarkup=(heading=LAB_HEADING)=>`<section class="lab-heading" aria-labelledby="labTitle"><h1 id="labTitle" tabindex="-1">${escapeText(heading.title)}</h1><div class="info-body"><p>${escapeText(heading.summary)}</p></div></section>`;
