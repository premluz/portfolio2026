---
title: Assistant
type: spec
status: active
owner: Prem
updated: 2026-10-16
summary: Assistant behaviour, curated knowledge and grounded answers.
tags: [area/assistant]
related: [CONTENT_MODEL.md]
---
# Portfolio assistant

The assistant is a dedicated `#assistant` page. Its composer grows from the site's bottom liquid navigation, with a site index on the left and Send on the right. The index groups Home, About, Contact, Shipped and Lab. The page keeps its conversation in browser `sessionStorage` for the current web session, including restored portfolio cards, citations and suggested questions after reload. The server-side answer route is `POST /api/assistant`: the Worker sends the visitor's question, the site's **published** project and profile records, and approved knowledge facts to an OpenAI-compatible model API. Configured AI requests synthesize answers rather than short-circuiting common prompts to canned text. Authored answers remain available for offline recovery.

## What the model can see

The model is given one record per published document, built by `usableDocuments()` in `worker/assistant-core.mjs` from `content/catalog.json` (through the generated `dist/server/content.js`), so editing the catalog and running `npm run build` is all it takes to update what the assistant knows:

- **Projects** — every case-study field a visitor reads (summary, intro, context, challenge, role, highlights, key work, impact), plus client, category, kind and the prototype link, and the text of their blocks.
- **Pages** — Home, About and Contact, including timeline items.
- **Reusable sections** — Services, Experience and side projects, Approach, Testimonials (with attribution), and the About traits and unusual-things sections. Nested items keep both their title and their label (for example a role and its years).
- **Not sent** — drafts and archived content, the site footer, and `inline-context` (popover copy that repeats project content).

At this size (about 25,000 characters) it is simpler to send the whole set than to maintain a vector database. The model picks the relevant records while answering. A future semantic or vector retriever can replace `usableDocuments()` without changing the contract. `tests/assistant-sources.mjs` fails if a project field, a block's text or an attribution stops reaching the model, so new content types cannot be dropped silently.

## Conversation context

Each question carries up to 12 turns within a 48,000-character history budget. Assistant turns also carry the IDs of the projects shown, passed to the model as `shownProjects` so follow-ups resolve correctly. The 2,200-token output budget permits richer comparisons and role reviews. `dist/assistant-limits.js` defines the shared budgets. `tests/assistant-follow-up.mjs` and `tests/assistant-conversation.mjs` cover context and response validation.

## Curated knowledge and answers

Edit `dist/knowledge/profile.js` for approved public profile facts: stable `id`, `title`, `topic`, `text`, `route`, `tags`, and supporting published `sourceIds`. Project details remain in `content/catalog.json`; do not duplicate case studies into profile facts. `dist/assistant-knowledge.js` owns offline recovery answers and suggested questions. The Worker validates profile provenance and returned source IDs, and links cited knowledge back to its published evidence. All shipped knowledge is public; keep private notes, drafts, credentials and unconfirmed claims outside `dist` and the corpus.

Useful additions, when confirmed: problem-framing and validation methods; collaboration and stakeholder responsibilities; actual leadership scope and mentoring; implementation tools linked to projects; exact outcomes with attribution and limitations; lessons and trade-offs; and approved location, availability or engagement preferences. Never infer these from seniority or a job description.

`worker/assistant-policy.mjs` separates grounded answers, conversation, clarification, general explanations, job-fit reviews and unknown facts. Grounded claims and job-fit reviews require evidence; greetings and general explanations do not need forced portfolio citations. Job-fit answers are concise and recruiter-facing: they lead with documented strengths and transferable evidence, and only briefly flag a material professional gap when it affects the match. Missing documentation is not proof of missing experience. Provider/network failures are explicitly presented as service/fallback problems, not missing knowledge.

## Pasted job descriptions

Paste a role description into the composer, optionally prefixed with “Review Prem’s fit for this role”. Inputs support up to 12,000 characters. Reviews render in the existing chat answer area with short sections: Overall fit; Strongest matches; Transferable experience; Recommended projects to review. Relevant cards and source links follow the answer. A generic “Not documented / questions to confirm” section is intentionally omitted; availability, location, schedule, contract, rate and optional domain experience are not raised unless explicitly asked or materially relevant to the professional match.

Reviews compare professional requirements against documented evidence without invented qualifications, numerical fit scores, protected-characteristic inference or a hiring verdict. Requirements are untrusted user input, not facts about Prem or instructions that override the assistant policy. A follow-up retains the role within the bounded conversation history.

## Modules and verification

`worker/assistant-core.mjs` handles requests and source assembly; `assistant-model.mjs` handles provider calls; `assistant-policy.mjs` owns instructions and validation. Client rendering, composer/voice controls and submissions live in `dist/assistant-view.js`, `assistant-composer.js`, and `assistant-session.js`, with transport in `assistant-client.js`.

Run `node tests/assistant-conversation.mjs`, `node tests/assistant-api.mjs`, `node tests/assistant-sources.mjs`, and `node tests/assistant-follow-up.mjs`. These use mocked providers and are not a live model-quality guarantee. `npm run dev` serves authored files and fresh catalog data; Node watch reloads imported policy/knowledge modules. Production knowledge/code changes need `npm run build` and a new deployment. Do not edit generated `dist/server` or `dist/client` copies.

## Runtime configuration

The actual model connection is inactive until all three Site runtime variables are configured:

- `AI_API_BASE_URL` — the provider's OpenAI-compatible API base, including its version path when required.
- `AI_API_KEY` — a secret, stored only in server runtime configuration, such as Vercel environment variables.
- `AI_MODEL` — the provider's model identifier.

OpenAI configuration uses `AI_API_BASE_URL=https://api.openai.com/v1` and `AI_MODEL=gpt-6-luna`. The route also accepts the conventional `OPENAI_API_KEY` secret if it is used instead of `AI_API_KEY`. For OpenAI, requests use Flex processing, disable response storage, and constrain source IDs with Structured Outputs. Luna uses `reasoning_effort=none` to keep short answers fast and inexpensive. If Flex returns a resource-unavailable 429, the route immediately retries with `service_tier=auto` so the chat remains usable. Other OpenAI-compatible providers retain the generic request format.

## Spoken answers

Set the Site secret `AI_VOICE_KEY` to an ElevenLabs API key. The Worker calls ElevenLabs Text to Speech with Flash v2.5 and the George voice (`JBFqnCBsd6RMkjVDRZzb`) by default; an optional `AI_VOICE_ID` runtime variable selects another voice. The browser receives MP3 audio through `POST /api/voice`, never the key. Each assistant reply carries a signed, 12-hour token tied to that exact text and browser session. The route rejects altered text, other origins and oversized payloads, and limits generation to 12 requests per session and 40 per client IP per hour per Worker isolate. The browser caches recent generated clips for replay without another provider call.

Sound is off by default for typed questions. Visitors can enable automatic reading from the Sound setting or the composer’s speaker button, or play one answer using its speaker control. The composer microphone uses the existing browser speech recognition: recognized site commands retain precedence, while other completed phrases on the assistant page become questions and their answers are read aloud automatically. Recognition pauses while an answer is prepared for playback and resumes when playback ends. Audio capture still follows the existing voice-consent guide. The assistant footer explains that spoken answer text is sent to ElevenLabs when played.

Do not add provider keys to source files, static assets, or `.openai/hosting.json`. Until configured, the UI retains its previous deterministic, content-grounded answer path; speech controls appear only for answers authorized by the server with `AI_VOICE_KEY` configured.

## Usage and privacy controls

- Questions and pasted descriptions are limited to 12,000 characters; a browser session has a 20-question limit.
- The Worker also limits model calls to 20 per session and 50 per client IP per hour per active isolate. These in-memory limits are best-effort across Worker isolates; set a spend or rate limit with the model provider for an account-wide budget cap.
- Model calls have a 2,200-token output cap and 30-second timeout. Unavailable OpenAI Flex capacity retries at Standard processing.
- The last 40 chat entries, including pasted descriptions, remain in browser session storage. Clear the tab’s session storage to remove them. No application-side job-description database is introduced. The current question, bounded history, published content and approved facts are sent to the provider. OpenAI requests set `store:false`; provider account retention policies still apply.
- Empty answers and unknown citations are rejected. Detailed answers beyond the existing 1,000-character speech budget are text-only.
