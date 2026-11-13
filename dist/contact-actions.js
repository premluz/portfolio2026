import {showNoticeNear} from './anchored-notice.js';
export const CONTACT_LINKEDIN_URL='https://www.linkedin.com/in/premluczak/';
const encodedEmail='cHJlbS5sdWN6YWtAZ21haWwuY29t';

export async function copyContactEmail(notify,clipboard=globalThis.navigator?.clipboard){
 try{
  if(!clipboard?.writeText)throw Error('Clipboard access is unavailable.');
  await clipboard.writeText(atob(encodedEmail));
  notify('Copied to clipboard',{key:'email'});return true;
 }catch(error){
  console.warn('Contact email could not be copied.',error);
  notify('Could not copy email. Please try again.',{key:'email',tone:'error'});return false;
 }
}

// The footer's LinkedIn and Email actions as text links, for the Contact page where the footer is hidden.
export const contactLinksMarkup=()=>`<nav class="contact-links" aria-label="Get in touch"><a href="${CONTACT_LINKEDIN_URL}" target="_blank" rel="noopener noreferrer">LinkedIn</a><button type="button" data-copy-email>Email</button></nav>`;

// anchored: confirm under the clicked control instead of in the site toast.
export function mountContactEmailCopy(root,notify,{anchored=false}={}){
 const copy=event=>{
  const button=event.target.closest?.('[data-copy-email]');
  if(!button)return;
  event.preventDefault();void copyContactEmail(anchored?(text,options)=>showNoticeNear(button,text,options):notify);
 };
 root.addEventListener('click',copy);
 return ()=>root.removeEventListener('click',copy);
}
