// Keep site-level Escape reliable even when a focused descendant prevents the
// bubbling key event. Modal/popover capture handlers run first and can consume it.
export function handleEscapeKey(event,activateBack){
 if(event.key!=='Escape'||event.defaultPrevented||event.isComposing)return false;
 event.preventDefault();activateBack();return true;
}
