# Portfolio assistant

The assistant is a dedicated `#assistant` page. Its composer grows from the site's bottom liquid navigation, with a site index on the left and Send on the right. The index groups Home, About, Contact, Shipped and Lab. The page keeps its conversation in browser `sessionStorage` for the current web session, including restored portfolio cards, citations and suggested questions after reload. The server-side answer route is `POST /api/assistant`: for open questions the Worker sends the visitor's question, the site's **published** project and profile records, and approved knowledge facts to an OpenAI-compatible model API. The model composes a concise third-person answer and source IDs; the Worker accepts only IDs from those sources. Common exact prompts return an authored answer without a model call.

## What the model can see

The model is given one record per published document, built by `usableDocuments()` in `worker/assistant-core.mjs` from `content/catalog.json` (through the generated `dist/server/content.js`), so editing the catalog and running `npm run build` is all it takes to update what the assistant knows:

- **Projects** — every case-study field a visitor reads (summary, intro, context, challenge, role, highlights, key work, impact), plus client, category, kind and the prototype link, and the text of their blocks.
- **Pages** — Home, About and Contact, including timeline items.
- **Reusable sections** — Services, Experience and side projects, Approach, Testimonials (with attribution), and the About traits and unusual-things sections. Nested items keep both their title and their label (for example a role and its years).
- **Not sent** — drafts and archived content, the site footer, and `inline-context` (popover copy that repeats project content).

At this size (about 25,000 characters) it is simpler to send the whole set than to maintain a vector database. The model picks the relevant records while answering. A future semantic or vector retriever can replace `usableDocuments()` without changing the contract. `tests/assistant-sources.mjs` fails if a project field, a block's text or an attribution stops reaching the model, so new content types cannot be dropped silently.

## Curated knowledge and answers

Edit `dist/assistant-knowledge.js` to add independently authored `facts` (stable ID, title, text and optional route), `answers` (exact normalized phrases, approved response, source IDs and follow-ups), or opening `suggestedQuestions`. Facts are public, versioned content in the source repository; never put secrets or unapproved private material there. The Worker includes facts in the grounded model corpus and validates every returned ID. The client and Worker share the same curated answers, so common questions cost no model tokens even when the API is unavailable. The build copies this file into the Worker bundle.

## Runtime configuration

The actual model connection is inactive until all three Site runtime variables are configured:

- `AI_API_BASE_URL` — the provider's OpenAI-compatible API base, including its version path when required.
- `AI_API_KEY` — a secret, stored only in Sites runtime configuration.
- `AI_MODEL` — the provider's model identifier.

OpenAI configuration uses `AI_API_BASE_URL=https://api.openai.com/v1` and `AI_MODEL=gpt-6-luna`. The route also accepts the conventional `OPENAI_API_KEY` secret if it is used instead of `AI_API_KEY`. For OpenAI, requests use Flex processing, disable response storage, and constrain source IDs with Structured Outputs. Luna uses `reasoning_effort=none` to keep short answers fast and inexpensive. If Flex returns a resource-unavailable 429, the route immediately retries with `service_tier=auto` so the chat remains usable. Other OpenAI-compatible providers retain the generic request format.

## Spoken answers

Set the Site secret `AI_VOICE_KEY` to an ElevenLabs API key. The Worker calls ElevenLabs Text to Speech with Flash v2.5 and the George voice (`JBFqnCBsd6RMkjVDRZzb`) by default; an optional `AI_VOICE_ID` runtime variable selects another voice. The browser receives MP3 audio through `POST /api/voice`, never the key. Each assistant reply carries a signed, 12-hour token tied to that exact text and browser session. The route rejects altered text, other origins and oversized payloads, and limits generation to 12 requests per session and 40 per client IP per hour per Worker isolate. The browser caches recent generated clips for replay without another provider call.

Sound is off by default for typed questions. Visitors can enable automatic reading from the Sound setting or the composer’s speaker button, or play one answer using its speaker control. The composer microphone uses the existing browser speech recognition: recognized site commands retain precedence, while other completed phrases on the assistant page become questions and their answers are read aloud automatically. Recognition pauses while an answer is prepared for playback and resumes when playback ends. Audio capture still follows the existing voice-consent guide. The assistant footer explains that spoken answer text is sent to ElevenLabs when played.

Do not add provider keys to source files, static assets, or `.openai/hosting.json`. Until configured, the UI retains its previous deterministic, content-grounded answer path; speech controls appear only for answers authorized by the server with `AI_VOICE_KEY` configured.

## Usage and privacy controls

- Questions are limited to 240 characters; a browser session has a 20-question limit.
- The Worker also limits model calls to 20 per session and 50 per client IP per hour per active isolate. These in-memory limits are best-effort across Worker isolates; set a spend or rate limit with the model provider for an account-wide budget cap.
- The model call is capped at 160 output tokens and has a 16-second timeout. OpenAI Flex is priced at half the Standard token rate; an unavailable Flex request falls back to Standard processing.
- The Site stores the last 40 chat entries in browser session storage so the conversation survives page navigation and reload during the web session. It does not save them on the Site server. For open questions, the current question, up to four previous chat entries (400 characters each), published portfolio content and approved knowledge facts are sent to the model provider. History clarifies follow-up questions; only approved sources support answers.
- The assistant refuses empty or ungrounded model responses and only renders citations to published documents.
