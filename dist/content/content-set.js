// Content sets are content/catalog*.json files built side by side; only their names cross the network.
export const DEFAULT_CONTENT_SET='catalog';
export const CONTENT_SET_PATTERN=/^catalog[a-z0-9-]{0,40}$/;
export const isContentSetName=value=>typeof value==='string'&&CONTENT_SET_PATTERN.test(value);
