# Amplitude Wizard — for AI coding agents

The Amplitude Wizard (`@amplitude/wizard`) is a CLI that instruments any app with Amplitude analytics: framework detection, SDK install, event instrumentation, and verification. It has a first-class agent mode that streams NDJSON, auto-approves prompts, and exposes a stdio MCP server.

This file orients you in ~30 seconds. The full reference is at https://amplitude.com/llms-full.txt. Source of truth and latest README: https://github.com/amplitude/wizard.

## First call to make

Always run this first. It returns the full CLI surface (commands, flags, env vars, exit codes, glossary) as machine-readable JSON. It is hand-maintained and stable. Do not scrape `--help` text.

```bash
npx @amplitude/wizard manifest
```

## Quickstart

```bash
# 1. Discover what's already there (no writes, no network)
npx @amplitude/wizard status --json
npx @amplitude/wizard detect --json

# 2. Drive the full setup in agent mode (NDJSON to stdout)
npx @amplitude/wizard --agent --install-dir . --api-key "$AMPLITUDE_API_KEY"

# 3. Verify
npx @amplitude/wizard verify --json
```

For human-in-the-loop diff review, split the run:

```bash
npx @amplitude/wizard plan --json                        # → planId, no writes
npx @amplitude/wizard apply --plan-id <id> --yes         # execute (24h TTL)
npx @amplitude/wizard verify --json
```

## Capability flags (one sentence)

`--auto-approve` (silently pick recommended) ⊂ `--yes` (also OK to write files) ⊂ `--force` (also OK to overwrite/delete). `--agent` alone implies `--yes` for back-compat.

## Auth

If the user is not signed in, the wizard exits with code `3` and emits an `auth_required` lifecycle event with a `reason` (`no_stored_credentials`, `token_expired`, `refresh_failed`, or `env_selection_failed`) and an `instruction` field. Surface the instruction to the human, ask them to run `npx @amplitude/wizard login`, then re-invoke with the `resumeCommand` array. Or pass `--api-key <key>` for full automation.

## MCP server

For agents that speak MCP (Claude Code, Cursor, Windsurf):

```json
{
  "mcpServers": {
    "amplitude-wizard": {
      "command": "npx",
      "args": ["-y", "@amplitude/wizard", "mcp", "serve"]
    }
  }
}
```

Tools exposed: `detect_framework`, `get_project_status`, `plan_setup`, `verify_setup`, `get_auth_status`, `get_auth_token`.

## Requirements

Node.js ≥ 20. `npx` ships with Node.

## Deeper docs

- Full reference: https://amplitude.com/llms-full.txt
- Curated site index (every public page on amplitude.com, grouped by category): https://amplitude.com/sitemap-llms.txt
- README: https://github.com/amplitude/wizard#readme
- NDJSON / dual-mode architecture: https://github.com/amplitude/wizard/blob/main/docs/dual-mode-architecture.md
