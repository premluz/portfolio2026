# Published developer settings

Save the JSON file downloaded by **Export settings** in this folder. The export
with the newest `exportedAt` timestamp is the active site profile. Filenames and
file modification times do not determine which profile is selected.

On the Node server, refresh the page after saving an export here. The server reads
the active profile directly from this folder. A new settings revision replaces
previous browser settings once; later developer adjustments persist until the
published profile changes again.

For Vercel or Worker deployments, run `npm run build` and deploy. The build embeds
the active export in `dist/published-settings.js` and copies it to `dist/client/`.
Use `npm run build:settings` to regenerate just the authored published profile;
`node scripts/build-settings.mjs --check` detects stale generated settings.

Keep only portfolio settings exports as JSON files here. Invalid files or tied
newest export timestamps fail with an explicit error.
