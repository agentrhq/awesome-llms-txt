# llms-txt-score

Score an `llms.txt` file against the public [awesome-llms-txt](https://github.com/agentrhq/awesome-llms-txt) rubric. Like Lighthouse, but for `llms.txt`.

## Install

```bash
npx llms-txt-score https://stripe.com/llms.txt
```

Or globally:

```bash
npm install -g llms-txt-score
llms-txt-score https://resend.com/llms.txt
```

## Usage

```
llms-txt-score <url-or-file> [options]

  --format=json|markdown   output format (default: json)
  --out=<path>             write to a file
  --check-links            sample 8 links and HEAD them for stability points
  --content-type=<ct>      override Content-Type when scoring a local file
  --no-color               disable ANSI color in markdown output
```

## What it scores (100 points)

| Weight | Criterion |
|------:|---|
| 18 | Spec compliance: H1, blockquote, well-formed `[name](url): note` lists |
| 20 | Coverage: section count, total links, canonical-section diversity |
| 14 | Agent-action declarations: `llms-full.txt`, `.md` twins, MCP, OpenAPI |
| 10 | Linked-content stability: sampled HEAD checks |
| 10 | Freshness: `Last-Modified` within 90 days |
|  8 | Discoverability: served at `/llms.txt`, no redirect chain |
|  8 | Auth signposting: keywords + dedicated auth section |
|  6 | Size discipline: context-window friendliness |
|  4 | Content-Type & encoding: `text/markdown; charset=utf-8` |
|  2 | Voice: plain language, no marketing fluff |

Full rubric, weights, and rationale: [RUBRIC.md](https://github.com/agentrhq/awesome-llms-txt/blob/main/RUBRIC.md).

Grade bands (Mozilla Observatory style, capped at 100): **A+** ≥ 95, **A** ≥ 85, **A-** ≥ 80, **B+** ≥ 75, **B** ≥ 65, **C** ≥ 50, **D** ≥ 35, **F** < 35.

## Output

`--format=json` (default) returns a stable shape, safe to commit as `score.json`:

```json
{
  "schema_version": 1,
  "score": 87,
  "grade": "A",
  "components": [
    { "id": "spec_compliance", "points": 17, "max": 18, "reasons": [] },
    ...
  ],
  "parsed": { "h1": "Stripe Documentation", "section_count": 23, "link_count": 472 }
}
```

`--format=markdown` is meant for humans / CI logs.

## Why no dependencies

Zero runtime deps. The CLI is `node ./bin/llms-txt-score.js` and works with any Node ≥ 18. Anyone can clone the repo, run the tool, and get the same number we did.

## License

MIT. See [`LICENSE`](./LICENSE).
