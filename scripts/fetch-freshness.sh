#!/usr/bin/env bash
# Fetch HEAD headers for every accepted llms.txt and write a per-URL block to a temp file.
# Then a Node post-processor turns those blocks into freshness.json.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS="$ROOT/research/results.json"
OUTDIR="$ROOT/research/.freshness"
mkdir -p "$OUTDIR"

# Extract accepted URLs as "domain\turl" pairs.
node -e "
const r = require('$RESULTS');
for (const row of r) {
  if (!row.accepted) continue;
  const url = row.final_url || row.fetched_url;
  if (!url) continue;
  // Sanitize the domain to a filesystem-safe filename.
  const slug = row.domain.replace(/[^a-zA-Z0-9._-]/g, '_');
  console.log(slug + '\t' + row.domain + '\t' + url);
}
" > "$OUTDIR/queue.tsv"

count=$(wc -l < "$OUTDIR/queue.tsv" | tr -d ' ')
echo "queued: $count URLs"

# Run HEAD in parallel. -I = HEAD; -L = follow redirects; -s = silent body; -m = timeout; -k = ignore cert; print headers to slug.txt.
# If a site rejects HEAD with 4xx/5xx, fall back to a GET that discards the body.
fetch_one() {
  local slug="$1" domain="$2" url="$3"
  local out="$OUTDIR/$slug.headers"
  # Try HEAD first.
  local resp
  resp=$(curl -ILs -m 15 --max-redirs 3 -A 'llms-txt-score/0.2 (+https://github.com/agentr-labs/awesome-llms-txt)' -A '' "$url" -o "$out" -w '%{http_code}|%{content_type}|%{url_effective}\n' 2>/dev/null || true)
  local status="${resp%%|*}"
  if [[ "$status" == "0" || "$status" == "" || "$status" =~ ^4 || "$status" =~ ^5 ]]; then
    # Fallback: GET, discard body, keep headers.
    resp=$(curl -sIL -m 15 --max-redirs 3 -A 'llms-txt-score/0.2' "$url" -o "$out" -w '%{http_code}|%{content_type}|%{url_effective}\n' 2>/dev/null || true)
  fi
  # Append the metadata line at the end of headers file (separated by sentinel).
  printf -- '---META---\n%s\n%s\n%s\n%s\n' "$domain" "$url" "$resp" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$out"
}

export -f fetch_one
export OUTDIR

# Run with up to 30 in flight.
awk -F '\t' '{print $1 "\t" $2 "\t" $3}' "$OUTDIR/queue.tsv" \
  | xargs -P 30 -n 1 -I {} bash -c 'IFS=$'\''\t'\'' read -r slug domain url <<< "$@"; fetch_one "$slug" "$domain" "$url"' _ {}

echo "fetched $(ls "$OUTDIR" | grep -c '\.headers$') header files"
