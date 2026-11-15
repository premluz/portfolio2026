// The #system route (developer mode only): each component rendered by the real renderers from synthetic fixtures with
// worst-case content. The media are SVG files at exact ratios, so nothing depends on the owner's real projects.
import {card,cardDetail} from './card-renderer.js';
import {pageBlocksMarkup} from './page-blocks.js';
import {escapeText} from './content/html.js';

export const SPECIMEN_ROUTE='system';
const MEDIA=Object.freeze({
 tall:{url:'assets/specimen/tall.svg',ratio:460/1000,alt:'A tall test image'},
 wide:{url:'assets/specimen/wide.svg',ratio:1400/600,alt:'A wide test image'},
 square:{url:'assets/specimen/square.svg',ratio:1,alt:'A square test image'},
 landscape:{url:'assets/specimen/landscape.svg',ratio:1.6,alt:'A landscape test image'}
});
const LONG='Reimagining the end-to-end onboarding, verification and settlement experience for a multi-sided marketplace across twelve regions and four regulators';
const UNBROKEN='Supercalifragilisticexpialidocious_unbreakable_identifier_without_any_spaces_at_all_1234567890';

// A fixture is a project as the card and page renderers receive it; `media` picks one of the files above.
const project=(id,{media,...fields})=>{
 const asset=media?MEDIA[media]:null;
 return Object.freeze({id,documentId:id,name:fields.title,bg:'linear-gradient(155deg,#e9e4f5,#dcebf2)',cardAspect:asset&&asset.ratio<1?'portrait':'landscape',...(asset?{image:asset.url,imageAlt:asset.alt,cardRatio:asset.ratio}:{}),...fields});
};
export const SPECIMEN_PROJECTS=Object.freeze([
 project('specimen-long',{media:'landscape',title:LONG,client:'A Very Long Company Name Incorporated International',year:'2024–2026',shortCategory:'Marketplace',summary:`${LONG}. ${UNBROKEN}`,intro:LONG,context:`${LONG}.`,role:'Lead designer',keyWork:`${UNBROKEN}`,projectStatus:'Building'}),
 project('specimen-tall',{media:'tall',title:'Tall hero, ratio 0.46',client:'Fixture',year:'2025',shortCategory:'Mobile',summary:'A phone screen captured full length.',intro:'A tall hero.',context:'Context.',role:'Designer',keyWork:'Key work.',projectStatus:'Launched'}),
 project('specimen-wide',{media:'wide',title:'Wide hero, ratio 2.33',client:'Fixture',year:'2025',shortCategory:'Dashboard',summary:'A panoramic dashboard.',intro:'A wide hero.',context:'Context.',role:'Designer',keyWork:'Key work.',projectStatus:'Launched'}),
 project('specimen-square',{media:'square',title:'Square hero, ratio 1.0',client:'Fixture',year:'2025',shortCategory:'App',summary:'A square tile.',intro:'A square hero.',context:'Context.',role:'Designer',keyWork:'Key work.',projectStatus:'R&D'}),
 project('specimen-text',{title:'No media at all',summary:'A project with only words: the card and page both stand without an image.',intro:'Text only.',context:'Context.',role:'Designer',keyWork:'Key work.',projectStatus:'Building'}),
 project('specimen-bare',{title:'Only a title',role:'Designer',context:'x',keyWork:'x',projectStatus:'Launched'})
]);

const ASSETS=Object.freeze({'specimen-wide':{url:MEDIA.wide.url,alt:MEDIA.wide.alt},'specimen-tall':{url:MEDIA.tall.url,alt:MEDIA.tall.alt}});
const store=Object.freeze({getAsset:id=>ASSETS[id]||null,get:()=>null,getCard:()=>null});
export const SPECIMEN_BLOCKS=Object.freeze([
 {id:'text',type:'text',label:'Eyebrow',title:`A heading that is long enough to wrap onto a second line in the reading column ${UNBROKEN}`,paragraphs:[`${LONG}.`,`${UNBROKEN}`]},
 {id:'metric',type:'metric',label:'Metric',value:'1,234,567,890%',description:'A very large number with a long explanation that wraps.'},
 {id:'quote',type:'quote',text:`"${LONG}"`,attribution:'A person with a particularly long name and an equally long job title, Somewhere Else Ltd'},
 {id:'table',type:'table',columns:['Decision','Option A','Option B','Option C','Option D','Option E'],rows:[[UNBROKEN,'a','b','c','d','e'],['Short','1','2','3','4','5']]},
 {id:'image-wide',type:'image',mediaId:'specimen-wide',alt:'A wide image',caption:`A caption under a wide image. ${LONG}`,layout:{width:'1280'}},
 {id:'image-tall',type:'image',mediaId:'specimen-tall',alt:'A tall image',caption:'A caption under a tall image.'}
]);

const item=(kind,id,markup)=>`<div class="system-item" data-specimen-item="${escapeText(kind)}:${escapeText(id)}">${markup}</div>`;
const section=(id,title,body)=>`<section class="system-section" data-specimen="${escapeText(id)}"><h2 class="system-heading">${escapeText(title)}</h2>${body}</section>`;

// The specimen page. Nothing here is a link or a project: ids are prefixed `specimen-` and no handler is bound to them.
export function systemMarkup(){
 const cards=SPECIMEN_PROJECTS.map((p,index)=>item('card',p.id,`<div class="system-card-slot">${card(p,index,'regular')}</div>`)).join('');
 const pages=SPECIMEN_PROJECTS.filter(p=>p.id!=='specimen-bare').map(p=>item('page',p.id,cardDetail(p,'regular',{headingBesideImage:false}))).join('');
 const blocks=SPECIMEN_BLOCKS.map(block=>item('block',block.id,pageBlocksMarkup([block],{store}))).join('');
 return `<div class="system-specimen" data-system-specimen><header><h1 class="system-title">System specimen</h1><p class="system-lede">Every component below is drawn by the real renderer from synthetic content. Developer mode only.</p></header>${section('cards','Cards',`<div class="system-cards">${cards}</div>`)}${section('pages','Project pages',pages)}${section('blocks','Page blocks',`<div class="system-blocks">${blocks}</div>`)}</div>`;
}
