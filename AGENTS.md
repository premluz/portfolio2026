---
title: Agent working rules
type: guide
status: active
owner: Prem
updated: 2026-10-26
summary: How any coding agent works in this repository: where things live, commands, rules, and how to leave memory for the next session.
tags: [area/docs, kind/process]
related: [PROJECT_STATE.md, TASKS.md, docs/CONSTITUTION.md]
---
# Agent working rules

This file is the single set of instructions for every agent. `CLAUDE.md` imports it; do not keep a second copy of these rules anywhere.

## Start here

1. Read [PROJECT_STATE.md](PROJECT_STATE.md) (current picture, open questions, next action).
2. Run `npm run memory:next` for ready tasks, and `npm run memory:task -- TASK-nnn` for one task with its context.
3. Find what you need with `npm run memory:search -- some words [--tag area/home] [--type spec]` instead of reading every document. The principles are in [docs/CONSTITUTION.md](docs/CONSTITUTION.md); intended behaviour is in the topic docs and [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md); decisions are in `docs/decisions/`; verified findings are in [docs/FACTS.md](docs/FACTS.md).

## Commands

- `npm run dev` serves `dist/` and the catalog directly; add `?dev=1` to show the developer settings. For an isolated test server use `PORT=3417 HOST=127.0.0.1 node deploy/node-server.mjs --dev`; port 3000 normally runs the built copy.
- `npm run images` after adding or replacing any image. `npm run build` then `npm run check`. Both stop on stale images and on invalid content.
- Tests are `tests/*.mjs`. `npm run check` stops at the first failure, so to see them all run `for f in tests/*.mjs; do node "$f" >/dev/null 2>&1 || echo "FAIL $f"; done`.
- Known failures are listed in [PROJECT_STATE.md](PROJECT_STATE.md). Any other failure is yours to explain or fix.
- npm is the only package manager. Do not add a dependency without the owner's approval.

## Rules

- **Read before you write.** View the files you will change, as they are now. Search for an existing helper, token or pattern before creating one.
- **Authored versus generated.** Edit sources only: `dist/*.js|css|html`, `content/catalog*.json`, `tests/`, `scripts/`, docs. Never edit `dist/client/`, `dist/content/` exports, `dist/site.css`, `dist/image-variants.js`, `dist/assets/optimised/` or `dist/assets/backgrounds/`.
- **Two content sets.** `catalog.json` and `catalog2.json` are both validated. Keep shared ids and asset files consistent in both; one invalid value or missing file stops the whole content build.
- **Images and media.** Originals go in `dist/assets/`; see [MEDIA_ASSETS.md](MEDIA_ASSETS.md). Backdrops are assets whose id ends in `-bg`. Commit generated copies with their originals.
- **Tokens.** Use `tokens.css` variables and `motion-tokens.js` roles; no literal colours, easing curves or sizes where a token exists, and no inline style objects in markup. A CSS twin of a JavaScript value needs a test (see `tests/motion-tokens.mjs`).
- **One page.** `dist/index.html` is the only page; the Lab is the in-app route `#lab` (ADR-011) and `lab.html` just redirects, so a new control goes in `index.html` only.
- **New behaviour starts off** behind a setting (ADR-005) and is persisted and exported with the other settings (`default-settings.js`, `settings-transfer.js`).
- **Committing.** Stage only your own work; if the owner has unfinished changes in the same file, build the staged version from HEAD plus your lines, and regenerate generated files (`dist/site.css`) from committed sources rather than hunk-staging them. Verify in a clean `git worktree` of HEAD ([FACT-008](docs/FACTS.md)).
- **Minimal diffs.** Change what the task needs. Report other problems you notice; do not fix them unasked. Hide rather than delete.
- **Destructive or outward actions need confirmation:** deleting files you did not create, force-pushing, publishing, installing software.
- **No secrets** in files, logs or examples. If you meet one, stop and tell the owner.

## Verify before you say done

Run the tests that cover the change and, for anything visible, load the page and measure it (a headless browser with Playwright is installed). Report failures with their output. Say explicitly when no verification exists.

## Leave memory for the next session

After meaningful work, in this order:

1. Update the task in [TASKS.md](TASKS.md): set its status, and add `Evidence` when it is done. Add a task for new work you leave behind.
2. Append an entry to [PROGRESS.md](PROGRESS.md) with what changed, the evidence and any risk left.
3. Refresh [PROJECT_STATE.md](PROJECT_STATE.md) and the "Open items" in [HANDOFF.md](HANDOFF.md) if the picture or next action changed. Record a lasting choice as an ADR and a measured finding in [docs/FACTS.md](docs/FACTS.md).
4. Run `npm run memory:index && npm run memory:check`.

The same memory is available to MCP clients through the read-only server described in [docs/MEMORY_MCP.md](docs/MEMORY_MCP.md); it is not registered by default.

Memory documents carry front matter (`title`, `type`, `status`, `owner`, `updated`, `summary`, `tags`; tags come from `docs/memory.config.json`) and stable IDs: `REQ-nnn`, `TASK-nnn`, `ADR-nnn`, `FACT-nnn`, `Q-nnn`. IDs never change or get reused; supersede instead of rewriting. Never put users' chat content or credentials in memory documents.
