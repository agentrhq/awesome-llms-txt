# Outreach DM templates

Two extremes drive shares. Message both: the A-graders (so they tweet the badge) and the notable F-graders (so they file the appeal). Twenty DMs on launch day, ten of each.

---

## Template A · for the top of the leaderboard

> Subject: your llms.txt scored well on the new leaderboard
>
> Hey [name] — we just shipped a public scored leaderboard of `llms.txt` files. Rubric is Lighthouse-style, public, contestable.
>
> [Site] scored **[N]** ([grade]). You're [rank #] of 1,023.
>
> Per-site permalink: `agentrhq.github.io/awesome-llms-txt/site/[domain].html`
> Badge to drop in your README: `https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/docs/badge/[domain].svg`
>
> Re-scored monthly. The badge updates automatically when your score changes.
>
> If anything in the rubric looks off for your file, the appeals process is public — open an issue and we debate it on the issue.

---

## Template B · for the bottom of the leaderboard (notable misses)

> Subject: your llms.txt scored [N] on a new public leaderboard — and the fix is 10 minutes
>
> Hey [name] — we shipped a scored leaderboard of `llms.txt` files. Rubric: github.com/agentrhq/awesome-llms-txt/blob/main/RUBRIC.md
>
> [Site]'s file scored **[N]** ([grade]). Per-site permalink: `agentrhq.github.io/awesome-llms-txt/site/[domain].html`
>
> The "What's weak" section on the page surfaces the three things to fix first. Most are 5-10 minute changes:
>
> - [first weak criterion + the file evidence]
> - [second]
> - [third]
>
> When you re-deploy, the next monthly crawl picks up the change. If you'd rather contest the score, the appeals issue template is in the repo. We re-grade on the issue.
>
> Not a sales note — just thought you'd want to know how your file landed in the first scored survey.

---

## Channel selection

- Public DevRel contact listed: email or DM the listed person on X.
- No DevRel: file an issue on their public `docs` repo (if one exists) referencing the score.
- No public contact: skip. The leaderboard reaches them via shares.

## Do not send

- To sites whose `llms.txt` we couldn't fetch — that's a separate "you should add one" message.
- More than once per site.
- Anything that reads like an SEO outreach template ("Quick question", "Hope you're doing well", etc.).

## Track sends

`launch/sent.csv`:

```csv
date,domain,template,channel,sent_by,response
```

Cull duplicates weekly.

## Outreach math

Day 0: send 20 (10A + 10F). Expect 3-5 responses, of which ~2 will tweet the badge or file an appeal.

Day 7: re-evaluate. If the data is right, the leaderboard grows by word-of-mouth from here. If not, do not flood — fix the rubric or the corpus.
