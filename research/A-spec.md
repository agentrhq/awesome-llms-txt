# A. llms.txt — Spec vs Convention

Sources: llmstxt.org, llmstxt.org/llms.txt, AnswerDotAI/llms-txt GitHub, Howard's Answer.AI post (2024-09-03), Mintlify docs, Vercel blog.

## (a) Canonical spec

Per llmstxt.org and the AnswerDotAI/llms-txt README, an llms.txt file is **markdown** served at the **root path `/llms.txt`** (subpaths allowed). Sections appear in a **specific order**:

1. **H1** with the project/site name. "This is the **only required section**." Verbatim from spec.
2. **Blockquote** with a short summary of the project. Optional.
3. **Zero or more markdown sections** (paragraphs, lists, "any type except headings") with more detail. Optional.
4. **Zero or more `## H2` sections** holding "file lists" — markdown bullet lists where each item is a **required hyperlink `[name](url)`** optionally followed by `:` and a note.

A specially named `## Optional` H2 has reserved meaning: links under it "can be skipped if a shorter context is needed." Everything else is non-prescriptive about which H2s to use.

The spec also recommends authors publish a markdown twin of each HTML page at the same URL plus `.md` (e.g., `page.md`, `index.html.md` for roots) so crawlers can fetch clean content.

**`llms-full.txt` is NOT in the spec.** It is a FastHTML/Answer.AI convention emitted by the `llms_txt2ctx` CLI (which also produces `llms-ctx.txt` and `llms-ctx-full.txt`). The README presents these explicitly as application choices, not standard.

Encoding, content-type, HTTP headers, file size, and ordering of H2 sections beyond "Optional last" are **not specified**.

## (b) Clear vs ambiguous

**Unambiguous:** only the H1 is required; markdown is required; root location is canonical; each file-list bullet must be a markdown link; "Optional" H2 means skippable.

**Ambiguous / implementer choice:**
- Whether `llms-full.txt` should exist at all, what it contains, and whether it should mirror `llms.txt` link-for-link.
- Absolute vs relative URLs (spec uses absolute in its own example, but does not forbid relative).
- Content-type (most adopters serve `text/markdown` or `text/plain`; spec is silent).
- Section names and ordering between the H1 and any final `## Optional`.
- Whether the file may include H3+ inside H2 file lists (spec says "any type except headings" for the intro block, but is silent inside H2s).
- `/.well-known/llms.txt` mirror (Mintlify ships it; spec does not require it).

## (c) Howard's "good practice" vs adopter convention

**Howard explicitly says** (Answer.AI post + spec): keep the file short enough to fit in a context window; use **concise, information-dense, unambiguous language**; "run a tool that expands your llms.txt file into an LLM context file and test a number of language models to see if they can answer questions"; provide `.md` twins of HTML pages.

**Convention, not spec** (Mintlify, Vercel, Stripe pattern): shipping both `/llms.txt` and `/llms-full.txt`; alphabetical page ordering; truncating descriptions to ~300 chars; HTTP `Link: rel="llms-txt"` header; `X-Llms-Txt` header; `/.well-known/` mirror; grouping links under product-named H2s like `## Docs`, `## API`, `## Guides`.

## Implications for scoring

Weight a rubric toward what the spec actually mandates plus what Howard called best practice:

1. **Structural conformance** (H1 present, blockquote present, H2 file lists with proper `[name](url): note` bullets, `## Optional` used correctly) — highest weight, since this is the only objectively spec-defined surface.
2. **Link health and link-target quality** (200s, markdown or clean HTML targets, ideally `.md` twins existing) — directly serves Howard's stated goal.
3. **Conciseness and context-window fit** (token count, signal-to-noise, no duplicated boilerplate) — Howard's explicit best practice.
4. **Convention bonuses, not penalties** (`llms-full.txt`, `/.well-known/` mirror, correct content-type, absolute URLs) — reward but do not require, since the spec does not.
