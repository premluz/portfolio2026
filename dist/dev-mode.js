export const DEV_MODE_PARAM='dev';
export const DEV_MODE_VALUE='1';

export function isDevMode(search){
 return new URLSearchParams(search).get(DEV_MODE_PARAM)===DEV_MODE_VALUE;
}

// Public visitors never see the utility controls; ?dev=1 reveals them for authoring.
export function mountDevMode(controls,search){
 const enabled=isDevMode(search);
 if(enabled)controls.hidden=false;
 return enabled;
}
