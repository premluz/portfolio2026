// A backdrop is a panoramic project background with its own pipeline. The `role` field is the record of intent; the
// `-bg` suffix stays recognised so existing assets need no edit. scripts/asset_roles.py is the Python twin and
// tests/asset-roles.mjs checks the two agree on every catalog asset.
export const BACKDROP_ROLE='backdrop';
export const isBackdrop=asset=>asset.role===BACKDROP_ROLE||asset.id.endsWith('-bg');
