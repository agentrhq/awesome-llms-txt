#!/usr/bin/env python3
"""Build results.json and B-crawl.md from fetched llms.txt files."""
import json
import os
import re
from pathlib import Path

ROOT = Path("/Users/zriyansh/Desktop/Projects/authsome-test/llms-txt/research")
RAW = ROOT / "raw"
META = ROOT / "meta"

H1_RE = re.compile(r"^# (.+)$", re.MULTILINE)
LINK_RE = re.compile(r"^\s*-\s*\[[^\]]+\]\(https?://", re.MULTILINE)


def parse_meta(path: Path):
    """Parse a meta file. Format:
    domain|url|fetched_at|http_code|content_type|size_download|url_effective
    """
    raw = path.read_text(encoding="utf-8", errors="replace").strip()
    # The "result" portion may itself contain pipes inside content_type or url, but
    # our format is fixed: 7 fields separated by '|'.
    parts = raw.split("|")
    if len(parts) < 7:
        return None
    domain = parts[0]
    fetched_url = parts[1]
    fetched_at = parts[2]
    http_code = parts[3]
    content_type = parts[4]
    size = parts[5]
    final_url = "|".join(parts[6:])
    try:
        http_code_i = int(http_code)
    except ValueError:
        http_code_i = 0
    try:
        size_i = int(size)
    except ValueError:
        size_i = 0
    return {
        "domain": domain,
        "fetched_url": fetched_url,
        "fetched_at": fetched_at,
        "http_status": http_code_i,
        "content_type": content_type,
        "size_bytes": size_i,
        "final_url": final_url,
    }


def evaluate(row):
    domain = row["domain"]
    sanitized = domain.replace("/", "_")
    raw_path = RAW / f"{sanitized}.txt"
    body = ""
    if raw_path.exists():
        try:
            body = raw_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            body = ""

    reject_reason = None
    accepted = True
    if row["http_status"] != 200:
        accepted = False
        reject_reason = f"http_{row['http_status']}"
    elif row["size_bytes"] <= 50:
        accepted = False
        reject_reason = "too_small"
    elif not row["content_type"].lower().startswith("text/"):
        accepted = False
        reject_reason = f"bad_content_type:{row['content_type'].split(';')[0]}"
    elif body.lstrip().startswith("<"):
        accepted = False
        reject_reason = "html_body"

    first_h1 = None
    link_count = 0
    if accepted:
        m = H1_RE.search(body)
        if m:
            first_h1 = m.group(1).strip()
        link_count = len(LINK_RE.findall(body))

    row.update({
        "accepted": accepted,
        "reject_reason": reject_reason,
        "first_h1": first_h1,
        "link_count": link_count,
    })
    return row


def main():
    rows = []
    # Build from domains.txt so we can also note any missing meta entries
    domains_file = ROOT / "domains.txt"
    extra_file = ROOT / "extra_domains.txt"
    domains = [d.strip() for d in domains_file.read_text().splitlines() if d.strip()]
    extras = set()
    if extra_file.exists():
        extras = {d.strip() for d in extra_file.read_text().splitlines() if d.strip()}

    for d in domains:
        sanitized = d.replace("/", "_")
        mpath = META / f"{sanitized}.meta"
        if mpath.exists():
            r = parse_meta(mpath)
            if r is None:
                rows.append({
                    "domain": d,
                    "fetched_url": f"https://{d}/llms.txt",
                    "fetched_at": "",
                    "http_status": 0,
                    "content_type": "",
                    "size_bytes": 0,
                    "final_url": "",
                    "accepted": False,
                    "reject_reason": "meta_parse_error",
                    "first_h1": None,
                    "link_count": 0,
                })
                continue
            r = evaluate(r)
            r["source"] = "github_mcp" if d in extras else "seed"
            rows.append(r)
        else:
            rows.append({
                "domain": d,
                "fetched_url": f"https://{d}/llms.txt",
                "fetched_at": "",
                "http_status": 0,
                "content_type": "",
                "size_bytes": 0,
                "final_url": "",
                "accepted": False,
                "reject_reason": "no_response",
                "first_h1": None,
                "link_count": 0,
                "source": "github_mcp" if d in extras else "seed",
            })

    # Sort by domain for stability
    rows.sort(key=lambda r: r["domain"])

    (ROOT / "results.json").write_text(json.dumps(rows, indent=2, ensure_ascii=False))

    # Summaries
    total = len(rows)
    accepted = [r for r in rows if r["accepted"]]
    rejected = [r for r in rows if not r["accepted"]]
    reject_counts = {}
    for r in rejected:
        reject_counts[r["reject_reason"]] = reject_counts.get(r["reject_reason"], 0) + 1

    by_size_desc = sorted(accepted, key=lambda r: r["size_bytes"], reverse=True)[:10]
    by_size_asc = sorted(accepted, key=lambda r: r["size_bytes"])[:10]
    by_links_desc = sorted(accepted, key=lambda r: r["link_count"], reverse=True)[:10]

    # Notable: well-known sites with no llms.txt (not accepted)
    famous = {
        "anthropic.com", "openai.com", "platform.openai.com", "figma.com", "huggingface.co",
        "docker.com", "kubernetes.io", "nodejs.org", "python.org", "go.dev", "rust-lang.org",
        "swift.org", "fastly.com", "akamai.com", "bunny.net", "groq.com", "fireworks.ai",
        "perplexity.ai", "hashicorp.com", "gitlab.com", "discord.com", "mailgun.com",
        "mintlify.com", "tailwindcss.com", "remix.run", "astro.build", "fly.io",
        "mixpanel.com", "n8n.io", "retool.com", "axiom.co", "betterstack.com",
        "prometheus.io", "expo.dev", "ionicframework.com", "capacitorjs.com",
        "electron.com", "langchain.com", "plausible.io", "kubernetes.io",
    }
    famous_missing = sorted(
        r["domain"] for r in rejected if r["domain"] in famous
    )

    # Also flag domains that returned a 200 but were rejected (interesting masquerades)
    masquerades = sorted(
        f"{r['domain']} ({r['reject_reason']}, final_url={r['final_url']})"
        for r in rejected
        if r["http_status"] == 200
    )

    def row_line(r):
        return f"- `{r['domain']}` — {r['size_bytes']:,} bytes, {r['link_count']} links — {r['first_h1'] or '(no H1)'}"

    md = []
    seed_total = sum(1 for r in rows if r.get("source") == "seed")
    gh_total = sum(1 for r in rows if r.get("source") == "github_mcp")
    seed_accepted = sum(1 for r in rows if r.get("source") == "seed" and r["accepted"])
    gh_accepted = sum(1 for r in rows if r.get("source") == "github_mcp" and r["accepted"])

    md.append("# B-crawl: llms.txt research")
    md.append("")
    md.append(f"Fetched {total} domains. Accepted {len(accepted)}. Rejected {len(rejected)}.")
    md.append("")
    md.append("## Discovery method")
    md.append("")
    md.append(f"- Seed list (coordinator): {seed_total} domains, {seed_accepted} accepted")
    md.append(f"- GitHub MCP discovery (mcp__github__search_repositories + Awesome-llms-txt README): {gh_total} domains, {gh_accepted} accepted")
    md.append("")
    md.append("## Reject reason breakdown")
    md.append("")
    for k, v in sorted(reject_counts.items(), key=lambda x: -x[1]):
        md.append(f"- {k}: {v}")
    md.append("")
    md.append("## Top 10 accepted by size")
    md.append("")
    for r in by_size_desc:
        md.append(row_line(r))
    md.append("")
    md.append("## Top 10 smallest accepted")
    md.append("")
    for r in by_size_asc:
        md.append(row_line(r))
    md.append("")
    md.append("## Top 10 by link_count")
    md.append("")
    for r in sorted(accepted, key=lambda r: r["link_count"], reverse=True)[:10]:
        md.append(row_line(r))
    md.append("")
    md.append("## Notable: well-known sites with NO llms.txt")
    md.append("")
    if famous_missing:
        for d in famous_missing:
            r = next(rr for rr in rows if rr["domain"] == d)
            md.append(f"- `{d}` ({r['reject_reason']}, final_url={r['final_url']})")
    else:
        md.append("- (none)")
    md.append("")
    md.append("## Masquerades: 200 OK but rejected")
    md.append("")
    if masquerades:
        for m in masquerades:
            md.append(f"- {m}")
    else:
        md.append("- (none)")

    (ROOT / "B-crawl.md").write_text("\n".join(md) + "\n")
    print(f"Wrote results.json ({total} rows) and B-crawl.md")
    print(f"Accepted: {len(accepted)}  Rejected: {len(rejected)}")


if __name__ == "__main__":
    main()
