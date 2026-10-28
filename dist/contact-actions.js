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

export function mountContactEmailCopy(root,notify){
 const copy=event=>{
  if(!event.target.closest?.('[data-copy-email]'))return;
  event.preventDefault();void copyContactEmail(notify);
 };
 root.addEventListener('click',copy);
 return ()=>root.removeEventListener('click',copy);
}
