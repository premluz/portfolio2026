# API connections and data flow

## At a glance

| Browser action | Same-origin route | External service |
| --- | --- | --- |
| Ask a question | `POST /api/assistant` | Configured OpenAI-compatible Chat Completions endpoint, except curated answers which are local |
| Play an answer aloud | `POST /api/voice` | ElevenLabs Text to Speech |
| Dictate into the composer | Browser Speech Recognition API | Browser/OS-dependent; it may use a vendor service |
| Navigate with hand gestures | Browser camera + bundled MediaPipe | No application API request for the camera frames |

The browser never receives provider API keys. Configure them on the server or in the hosting provider's secret manager.

## Assistant request

The frontend sends JSON to `POST /api/assistant`:

```json
{
  "question": "What has Prem worked on?",
  "sessionId": "browser-session-id",
  "history": [
    {"role": "user", "text": "..."},
    {"role": "assistant", "text": "..."}
  ]
}
```

The Worker checks the request and first looks for a curated phrase/answer in `dist/assistant-knowledge.js`. Curated matches avoid a model request. Otherwise, it sends the question, up to four recent history messages and published portfolio/profile records plus approved knowledge facts to the configured Chat Completions endpoint. The model is instructed to use only those records and return answer text plus source IDs; the server discards any source ID outside the supplied corpus. The browser receives the answer, citations, follow-up suggestions and an optional signed speech token.

The content corpus is generated from published records in `content/catalog.json`. No vector database, external search index or transcript store is used.

## Model provider variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_BASE_URL` | Yes for model answers | HTTPS provider base URL, normally ending in `/v1`; the server appends `/chat/completions`. `localhost` is allowed for local development. |
| `AI_API_KEY` | Yes for model answers | Provider secret. The legacy `OPENAI_API_KEY` name is also accepted by the assistant handler. |
| `AI_MODEL` | Yes for model answers | Model identifier accepted by that provider. The example uses `gpt-6-luna`, the low-cost model selected for this site; use an enabled model on the destination account. |

The route uses temperature zero and a short output budget. For `api.openai.com`, it also requests JSON Schema output, disables provider storage, uses Flex processing and retries a specific Flex resource-unavailable response using automatic service tier. Other providers must support the OpenAI-compatible `/chat/completions` request shape; their exact JSON-schema and token-parameter compatibility can vary.

If the model is not configured or unavailable, the route falls back to authored portfolio answers where possible. The UI can still answer curated questions without a model key.

## Speech provider variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_VOICE_KEY` | Yes for voice | ElevenLabs API key. It is also used to sign short-lived playback tokens. |
| `AI_VOICE_ID` | Optional | ElevenLabs voice ID. The included `.env.example` carries the voice selected for this site; if omitted, the Worker code has a built-in fallback. |

The assistant response includes a token tied to the answer text, session ID and issue time. The browser sends that token and text to `POST /api/voice`. The server verifies it before calling `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128` with model `eleven_flash_v2_5`. The audio response is streamed back as MP3. This prevents the browser from using the API key to synthesize arbitrary text.

## Route controls and limits

- Both API routes are POST-only and reject cross-origin requests.
- Assistant question: at most 240 characters; request body capped at 4 KiB; conversation history capped at four messages.
- Assistant model calls: 20 per session and 50 per client IP per hour, tracked in memory per Worker isolate/process.
- Voice text: at most 1,000 characters; body capped at 2.2 KiB; 12 calls per session and 40 per client IP per hour.
- Speech tokens expire after 12 hours and are bound to the exact text and session ID.
- `AbortSignal.timeout` bounds provider calls. Provider failures return an authored fallback response when possible.

The counters are in-memory protection, not a global quota system. Serverless instances or multiple Node processes do not share counters. Add a shared rate-limit store before relying on these limits for a high-volume public deployment.

## Local and browser services

- Typed assistant questions go through `/api/assistant`.
- Optional narration goes through `/api/voice`; ElevenLabs receives only the response text selected for playback.
- Composer dictation uses `SpeechRecognition` / `webkitSpeechRecognition` where the browser supports it. Browser implementations can send speech to their own recognition service; this project does not control or guarantee local-only transcription.
- Gesture navigation runs the bundled MediaPipe code in the browser. Camera permission is requested only when gesture navigation is enabled. The application does not upload camera frames to its API.
- Portfolio prototypes are iframe URLs in the catalog, not API services. External hosts may block framing through their own headers.

## Secret handling

For local work, copy `.env.example` to `.env`. The `.env` file is ignored by Git. For production, use the host's secret/environment settings instead of uploading `.env`. Never place API keys in `dist/`, `content/catalog.json`, browser storage, HTML, JavaScript, screenshots or logs.
