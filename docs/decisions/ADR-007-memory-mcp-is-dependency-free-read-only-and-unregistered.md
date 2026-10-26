---
id: ADR-007
title: The memory MCP server is dependency-free, read-only and not registered by default
type: decision
status: accepted
owner: Prem
updated: 2026-10-26
summary: Project memory is exposed through a small stdio MCP server with no SDK dependency, read-only tools, and registration left to the owner.
tags: [area/tooling, area/docs, kind/decision]
related: [TASK-009, TASK-012, docs/MEMORY_MCP.md]
---
# ADR-007 The memory MCP server is dependency-free, read-only and not registered by default

**Context.** The owner approved exposing project memory through MCP. The project rule is no new dependencies without approval, and an MCP SDK would be one. Registering a server edits the owner's tool configuration, a separate decision from building it.

**Decision.** `scripts/memory-mcp.mjs` speaks the protocol directly (stdio, newline-delimited JSON-RPC; initialize, ping, tools/list, tools/call). It offers four read-only tools, reads only documents the memory loader finds, answers requests in order, and is not registered anywhere. Registration is TASK-012.

**Consequences.** No supply-chain surface and nothing to install. The protocol subset is small and covered by tests/memory-mcp.mjs; if a client needs more of the protocol (resources, prompts), revisit. Rejected: the official SDK (a new dependency for about 100 lines of handling) and registering the server unasked.
