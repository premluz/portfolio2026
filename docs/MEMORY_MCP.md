---
title: Project memory MCP server
type: ops
status: active
owner: Prem
updated: 2026-10-26
summary: A read-only MCP server over project memory; built and tested but deliberately not registered, since memory is maintained as Markdown.
tags: [area/tooling, area/docs]
related: [AGENTS.md, TASKS.md]
---
# Project memory MCP server

`scripts/memory-mcp.mjs` serves the project memory documents over the Model Context Protocol (stdio, newline-delimited JSON-RPC). It has no dependencies. It is **built but not registered** with any client; nothing starts it automatically.

## What it exposes

| Tool | Does |
| --- | --- |
| `memory_search` | Search by words, with `tag`, `type` and `status` filters. Hits carry `path:line`. |
| `memory_read` | Read one item by ID (`REQ-`, `TASK-`, `ADR-`, `FACT-`, `Q-nnn`) or one memory document by path. |
| `memory_next` | Open tasks whose dependencies are all done. |
| `memory_task` | One task with its dependencies and the IDs it mentions. |

Every tool is declared read-only. There are no write tools, and a path can only name a document the memory loader found (top-level Markdown files and `docs/`), so source code, content and `.env` are unreachable. The server reads the Markdown files only; it never touches users' chat content, which stays separate. Documents are re-read on each request, and requests are answered in arrival order.

## Registering it

Add it to a client's MCP configuration when you want it, for example Claude Code's project `.mcp.json`:

```json
{"mcpServers": {"project-memory": {"command": "node", "args": ["scripts/memory-mcp.mjs"]}}}
```

Run it from the project root. The owner decided on 2026-10-26 not to register it (TASK-012 was dropped): the Markdown files are the memory, and the same data is available with `npm run memory:search`, `memory:next` and `memory:task`.

## Testing

`tests/memory-mcp.mjs` checks the protocol, the read-only tool list, sources, path confinement, unknown tools, and a real stdio session.
