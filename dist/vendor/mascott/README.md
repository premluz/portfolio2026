# Mascott embed

Vendored from `/Users/przemek/mascott/packages/embed/dist/mascott-embed.js`,
`@mascott/embed` 0.1.0, on 2026-10-29.
SHA-256: `834c164f54f8b21cc6cd85887ec75a46441499dad943298d01e2f0d535611d0f`.

The existing standalone production bundle contains React, Three.js and the Mascott engine.
It is isolated from this site's separately vendored Three.js and needs no npm install.
The adapter is `dist/agent-webgl.js`; appearance is configured there.
The portfolio's existing agent engine owns positioning, travel and assistant activation.
This build tracks inline container movement, feeding the existing drag physics so travel
smears the glow, turns and stretches the body, and squashes it as it brakes.
`assets/agent.png` remains visible during loading and on bundle, WebGL or context failure.

To update, build packages in the Mascott repository and copy the standalone embed bundle
here; update this checksum and run the focused mascot browser tests and portfolio build.
