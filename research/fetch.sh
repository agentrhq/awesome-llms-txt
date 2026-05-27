#!/bin/bash
# Fetch llms.txt for a domain
domain="$1"
out_dir="/Users/zriyansh/Desktop/Projects/authsome-test/llms-txt/research/raw"
meta_dir="/Users/zriyansh/Desktop/Projects/authsome-test/llms-txt/research/meta"
mkdir -p "$meta_dir"

sanitized="${domain//\//_}"
outfile="$out_dir/${sanitized}.txt"
metafile="$meta_dir/${sanitized}.meta"

url="https://${domain}/llms.txt"
fetched_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

result=$(curl -L -s -m 15 --max-redirs 3 -A "Mozilla/5.0 (compatible; llms-txt-research/1.0)" -o "$outfile" -w '%{http_code}|%{content_type}|%{size_download}|%{url_effective}\n' "$url" 2>&1)

echo "${domain}|${url}|${fetched_at}|${result}" > "$metafile"
echo "DONE: $domain -> $result"
