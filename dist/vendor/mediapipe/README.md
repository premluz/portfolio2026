# Local hand tracking dependencies

MediaPipe Tasks Vision 0.10.21 (Google), Apache 2.0.
Source: https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.21.tgz
The npm archive was checked against its published SHA-512 integrity before extraction.
`vision_bundle.cjs` is stored as `vision_bundle.js` so classic workers receive a JavaScript MIME type. Its bytes are unchanged. The worker provides the `exports` object.

Hand Landmarker full float16 v1 model (Google):
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
Model information: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker

All dependencies are served by the portfolio itself and loaded only after gesture onboarding. No runtime CDN request or camera upload is used.

SHA-256 checksums:

- `LICENSE`: `8707eef0533987efc5b155d64761eeb6e20793f50b9bd1a68dad1cf4719d0ed8`
- `hand_landmarker.task`: `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`
- `vision_bundle.js`: `bf58c9b3f592304422947b51e1f7de360c67d4dfeaa900064352da0c5a7c9115`
- `wasm/vision_wasm_internal.js`: `4a97e2520ba506c680ecd6ba6acfb146888afa0e2746d57f205352bc6ebb82eb`
- `wasm/vision_wasm_internal.wasm`: `f00ec4731faa23b3e714d00e88d4d10e2df5c0a427d3a2b4ae6e3526fdd14ef7`
- `wasm/vision_wasm_nosimd_internal.js`: `927def7b465c51b86e4b3060f93646aca4e27121f4b8fc0483786e407ea9cf1f`
- `wasm/vision_wasm_nosimd_internal.wasm`: `3821ea9b1f7fb8c549ef2a064ef5c85750bf375c545a49fd6eea0df44a95f1f4`
