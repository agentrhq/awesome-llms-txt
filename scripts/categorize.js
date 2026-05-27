'use strict';

// Category set is fixed and visible to readers.
const CATEGORIES = [
  'ai-platform', 'dev-tools', 'docs-platform', 'billing', 'comms',
  'data', 'infra', 'observability', 'auth', 'search', 'content', 'commerce',
];

// Manual overrides for sites where keywords mislead (or where we want to fight
// the "well, technically..." tweet). Add aggressively; remove only when the
// data-driven path would land on the same answer.
const OVERRIDES = {
  'stripe.com': 'billing', 'docs.stripe.com': 'billing',
  'paddle.com': 'billing', 'lemonsqueezy.com': 'billing', 'adyen.com': 'billing', 'docs.adyen.com': 'billing',
  'resend.com': 'comms', 'sendgrid.com': 'comms', 'mailgun.com': 'comms',
  'postmark.com': 'comms', 'twilio.com': 'comms', 'slack.com': 'comms',
  'discord.com': 'comms', 'loops.so': 'comms',
  'anthropic.com': 'ai-platform', 'docs.anthropic.com': 'ai-platform',
  'openai.com': 'ai-platform', 'platform.openai.com': 'ai-platform',
  'cohere.com': 'ai-platform', 'docs.cohere.com': 'ai-platform',
  'mistral.ai': 'ai-platform', 'together.ai': 'ai-platform',
  'fireworks.ai': 'ai-platform', 'groq.com': 'ai-platform',
  'ollama.com': 'ai-platform', 'huggingface.co': 'ai-platform',
  'replicate.com': 'ai-platform', 'elevenlabs.io': 'ai-platform',
  'docs.crewai.com': 'ai-platform', 'mastra.ai': 'ai-platform',
  'python.langchain.com': 'ai-platform', 'langchain.com': 'ai-platform',
  'js.langchain.com': 'ai-platform',
  'pinecone.io': 'data', 'weaviate.io': 'data', 'turso.tech': 'data',
  'neon.tech': 'data', 'neon.com': 'data', 'planetscale.com': 'data',
  'prisma.io': 'data', 'mongodb.com': 'data', 'redis.io': 'data',
  'upstash.com': 'data', 'convex.dev': 'data',
  'www.tinybird.co': 'data', 'tinybird.co': 'data', 'supabase.com': 'data',
  'datadog.com': 'observability', 'newrelic.com': 'observability',
  'sentry.io': 'observability', 'posthog.com': 'observability',
  'amplitude.com': 'observability', 'mixpanel.com': 'observability',
  'segment.com': 'observability', 'grafana.com': 'observability',
  'axiom.co': 'observability', 'langfuse.com': 'observability',
  'www.helicone.ai': 'observability', 'helicone.ai': 'observability',
  'cloudflare.com': 'infra', 'developers.cloudflare.com': 'infra',
  'vercel.com': 'infra', 'netlify.com': 'infra', 'docs.netlify.com': 'infra',
  'render.com': 'infra', 'railway.app': 'infra', 'fly.io': 'infra',
  'modal.com': 'infra', 'bunny.net': 'infra', 'docker.com': 'infra',
  'docs.docker.com': 'infra', 'kubernetes.io': 'infra', 'pulumi.com': 'infra',
  'apify.com': 'infra',
  'auth0.com': 'auth', 'clerk.com': 'auth', 'workos.com': 'auth',
  'better-auth.com': 'auth', 'www.unkey.com': 'auth', 'unkey.com': 'auth',
  'mintlify.com': 'docs-platform', 'docs.mintlify.com': 'docs-platform',
  'readme.com': 'docs-platform', 'docs.gitbook.com': 'docs-platform',
  'cal.com': 'dev-tools', 'linear.app': 'dev-tools',
  'zapier.com': 'dev-tools', 'n8n.io': 'dev-tools', 'retool.com': 'dev-tools',
  'docs.retool.com': 'dev-tools',
  'docs.cursor.com': 'dev-tools', 'docs.codeium.com': 'dev-tools',
  'docs.warp.dev': 'dev-tools', 'turbo.build': 'dev-tools',
  'notion.so': 'dev-tools', 'docs.github.com': 'dev-tools',
  'github.com': 'dev-tools', 'trigger.dev': 'dev-tools',
  'chakra-ui.com': 'dev-tools', 'tailwindcss.com': 'dev-tools',
  'ui.shadcn.com': 'dev-tools', 'storybook.js.org': 'dev-tools',
  'nextjs.org': 'dev-tools', 'react.dev': 'dev-tools',
  'svelte.dev': 'dev-tools', 'astro.build': 'dev-tools',
  'docs.deno.com': 'dev-tools', 'vuejs.org': 'dev-tools',
  'remix.run': 'dev-tools', 'tauri.app': 'dev-tools', 'bun.sh': 'dev-tools',
  'deno.com': 'dev-tools', 'tamagui.dev': 'dev-tools', 'expo.dev': 'dev-tools',
  'docs.expo.dev': 'dev-tools',
  'shopify.com': 'commerce', 'docs.medusajs.com': 'commerce',
  'docs.commercelayer.io': 'commerce', 'docs.vendure.io': 'commerce',
  'www.mux.com': 'content',
  // Top-of-leaderboard fixes (these score high so they're the screenshot).
  'docs.convex.dev': 'data',
  'www.openfort.io': 'auth',
  'docs.zapier.com': 'dev-tools',
  'docs.apify.com': 'infra', 'apify.com': 'infra',
  'www.speakeasy.com': 'dev-tools',
  'docs.x.com': 'comms',
  'remult.dev': 'dev-tools',
  'www.deployhq.com': 'infra',
  'docs.scrapfly.io': 'infra',
  'docs.civic.com': 'auth',
  'docs.formo.so': 'observability',
  'docs.mangopay.com': 'billing',
  'docs.parallel.ai': 'ai-platform',
  'planharmony.com': 'dev-tools',
  'docs.chainbase.com': 'data',
  'docs.abs.xyz': 'infra',
  'developers.portone.io': 'billing',
  'uithing.com': 'dev-tools',
  'nitro.build': 'dev-tools',
  'nuxt.com': 'dev-tools',
  'keito.ai': 'ai-platform',
  'docs.venice.ai': 'ai-platform',
  'docs.brightdata.com': 'infra',
  'docs.weka.io': 'infra',
  'docs.redpanda.com': 'data',
  'docs.ionos.com': 'infra',
  'docs.dynamic.xyz': 'auth',
  'developer.tryfinch.com': 'data',
  'docs.sardine.ai': 'auth',
  'docs.useparagon.com': 'infra',
  'vite.dev': 'dev-tools',
  'angular.dev': 'dev-tools',
  'docs.comfy.org': 'ai-platform',
  'ai-sdk.dev': 'ai-platform',
  'ai.pydantic.dev': 'ai-platform',
  'docs.langwatch.ai': 'observability',
  'docs.videosdk.live': 'content',
};

// Keyword scoring fallback. Each row contributes `weight` to a category when
// its regex matches any of: H1, blockquote, section titles. Highest score wins.
const KEYWORDS = [
  { cat: 'billing',       re: /\b(payment|billing|invoice|subscription|checkout|payout|paywall|stripe|paddle|adyen)\b/i, weight: 2 },
  { cat: 'comms',         re: /\b(email|sms|message|notification|chat|mail|inbox|telephony|voip|conversation)\b/i,        weight: 2 },
  { cat: 'data',          re: /\b(database|postgres|mysql|sql|vector|orm|cache|kafka|stream|warehouse|olap|oltp|datalake)\b/i, weight: 2 },
  { cat: 'observability', re: /\b(observability|logging|tracing|telemetry|metric|analytics|monitor|tracing|profiling|apm|llm[-\s]?ops|prompt[-\s]?tracing)\b/i, weight: 2 },
  { cat: 'auth',          re: /\b(authentication|authorization|sso|oauth|identity|access[-\s]?control|api[-\s]?keys?\s+management|user[-\s]?management|rbac)\b/i, weight: 2 },
  { cat: 'auth',          re: /\bauth\b/i, weight: 1 },
  { cat: 'infra',         re: /\b(deploy|hosting|edge|cdn|kubernetes|container|serverless|paas|iaas|infrastructure)\b/i, weight: 2 },
  // Tightened: require model-specific patterns, not just "AI" or "agent" or "MCP".
  { cat: 'ai-platform',   re: /\b(inference\s+(api|engine|provider|platform)|llm\s+(api|provider|platform|gateway)|model\s+(serving|hosting|inference|provider|catalog)|chat\s+completions?|embedding\s+(api|model|provider)|fine[-\s]?tuning?|prompt\s+engineering|rag\s+(api|stack|engine)|vector\s+embedding|llm[-\s]?ops|foundation\s+model|generative\s+ai\s+(platform|api)|agent\s+(framework|sdk|runtime|builder)|ai\s+(inference|model|provider))/i, weight: 4 },
  // Soft fallback: still recognises a docs index that mentions LLMs and SDKs together.
  { cat: 'ai-platform',   re: /\bgenerative\s+ai\b/i, weight: 1 },
  { cat: 'docs-platform', re: /\b(documentation\s+(platform|host)|docs\s+as\s+a\s+service|mintlify|gitbook|readme\.com)\b/i, weight: 3 },
  { cat: 'commerce',      re: /\b(commerce|shopify|woocommerce|cart|catalog|inventory|merchant|sellers?)\b/i, weight: 2 },
  { cat: 'search',        re: /\b(search\s+(engine|api)|elasticsearch|opensearch|algolia|typesense|meilisearch)\b/i, weight: 3 },
  { cat: 'content',       re: /\b(video|streaming|cms|content\s+management|image\s+(processing|cdn)|asset[-\s]?delivery)\b/i, weight: 2 },
  { cat: 'dev-tools',     re: /\b(framework|sdk|library|component|cli|developer\s+tools|build\s+system|ide|linter)\b/i, weight: 1 },
];

function categorize(domain, parsed) {
  if (OVERRIDES[domain]) return OVERRIDES[domain];
  const corpus = [
    parsed.h1 || '',
    parsed.blockquote || '',
    ...(parsed.sections || []).map(s => s.title || ''),
    ...(parsed.intro_paragraphs || []),
  ].join(' ');
  const scores = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (const rule of KEYWORDS) {
    if (rule.re.test(corpus)) scores[rule.cat] += rule.weight;
  }
  // Pick winner; tiebreak toward dev-tools (broadest catch-all).
  let best = 'dev-tools', bestScore = 0;
  for (const [cat, sc] of Object.entries(scores)) {
    if (sc > bestScore) { best = cat; bestScore = sc; }
  }
  return best;
}

module.exports = { categorize, CATEGORIES, OVERRIDES };
