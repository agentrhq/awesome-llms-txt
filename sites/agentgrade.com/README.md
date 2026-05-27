---
domain: agentgrade.com
display_name: AgentGrade
category: billing
score: 68
grade: B
last_scored: 2026-05-27
verified_url: https://agentgrade.com/llms.txt
file_size_bytes: 8494
link_count: 27
value_link_count: 27
section_count: 7
freshness_age_days: null
---

# AgentGrade

![Score 68/100 — Grade B](../../docs/badge/agentgrade.com.svg)

Category: **billing** · [Live llms.txt](https://agentgrade.com/llms.txt) · Snapshot: [`llms.txt`](./llms.txt) · Machine-readable: [`score.json`](./score.json)

**H1:** AgentGrade

> Lighthouse for AI agents. Scan any URL for a 0–100 agent-readiness score covering payment protocols, discovery files, MCP endpoints, OpenAPI, identity, and infrastructure.

**File facts:** 8.3 KB · 7 `## sections` · 27 links (27 after low-value discount) · Freshness: unknown (no `Last-Modified` header).

## Scorecard

| Criterion | Score | Notes |
|---|---:|---|
| Spec compliance | 14/18 | _sections_without_link_lists, malformed_link_items_ |
| Coverage | 13/20 | |
| Agent-action declarations | 9/14 | _no_md_url_twins_ |
| Linked-content stability | 6/10 | _not_sampled_ |
| Freshness | 5/10 | _no_last_modified_header_ |
| Discoverability | 8/8 | |
| Auth signposting | 2/8 | _no_auth_section_ |
| Size discipline | 5/6 | |
| Content-Type & encoding | 4/4 | |
| Voice | 2/2 | |

## What's exceptional

- Discoverability (8/8)
- Content-Type & encoding (4/4)
- Voice (2/2)

## What's weak

- Auth signposting (2/8): no_auth_section

## Embed the badge

```markdown
[![llms.txt score 68 (B)](https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/docs/badge/agentgrade.com.svg)](https://github.com/agentrhq/awesome-llms-txt/tree/main/sites/agentgrade.com)
```

## Reproduce this score

```bash
npx llms-txt-score https://agentgrade.com/llms.txt
```

See [the rubric](../../RUBRIC.md) for what each criterion checks.
