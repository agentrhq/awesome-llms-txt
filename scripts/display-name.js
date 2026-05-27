'use strict';

// Manual overrides for sites where the H1 / domain root mangles the name.
const OVERRIDES = {
  'github.com': 'GitHub', 'docs.github.com': 'GitHub Docs',
  'gitlab.com': 'GitLab', 'docs.gitlab.com': 'GitLab Docs',
  'gitbook.com': 'GitBook', 'docs.gitbook.com': 'GitBook Docs',
  'mongodb.com': 'MongoDB', 'docs.mongodb.com': 'MongoDB Docs',
  'sdk.vercel.ai': 'Vercel AI SDK',
  'replicate.com': 'Replicate',
  'huggingface.co': 'Hugging Face',
  'docs.huggingface.co': 'Hugging Face Docs',
  'planetscale.com': 'PlanetScale',
  'mintlify.com': 'Mintlify', 'docs.mintlify.com': 'Mintlify Docs',
  'docs.stripe.com': 'Stripe Docs', 'stripe.com': 'Stripe',
  'docs.anthropic.com': 'Anthropic Docs', 'anthropic.com': 'Anthropic',
  'platform.openai.com': 'OpenAI Platform', 'openai.com': 'OpenAI',
  'docs.cohere.com': 'Cohere Docs', 'cohere.com': 'Cohere',
  'docs.crewai.com': 'CrewAI Docs',
  'docs.docker.com': 'Docker Docs',
  'docs.cursor.com': 'Cursor Docs',
  'docs.codeium.com': 'Codeium Docs',
  'docs.warp.dev': 'Warp Docs',
  'python.langchain.com': 'LangChain (Python)',
  'js.langchain.com': 'LangChain (JS)',
  'docs.netlify.com': 'Netlify Docs', 'netlify.com': 'Netlify',
  'docs.adyen.com': 'Adyen Docs', 'adyen.com': 'Adyen',
  'docs.expo.dev': 'Expo Docs', 'expo.dev': 'Expo',
  'docs.deno.com': 'Deno Docs', 'deno.com': 'Deno',
  'docs.medusajs.com': 'Medusa Docs',
  'docs.commercelayer.io': 'Commerce Layer Docs',
  'docs.vendure.io': 'Vendure Docs',
  'www.tinybird.co': 'Tinybird', 'tinybird.co': 'Tinybird',
  'www.gradio.app': 'Gradio',
  'www.mux.com': 'Mux', 'mux.com': 'Mux',
  'www.unkey.com': 'Unkey', 'unkey.com': 'Unkey',
  'www.helicone.ai': 'Helicone', 'helicone.ai': 'Helicone',
  'developers.cloudflare.com': 'Cloudflare Developers',
  'cloudflare.com': 'Cloudflare',
  'neon.tech': 'Neon', 'neon.com': 'Neon',
  'kotlinlang.org': 'Kotlin', 'lang.kotlinlang.org': 'Kotlin',
  'vuejs.org': 'Vue.js',
  'storybook.js.org': 'Storybook',
  'astro.build': 'Astro',
  'react.dev': 'React',
  'svelte.dev': 'Svelte',
  'nextjs.org': 'Next.js',
  'tailwindcss.com': 'Tailwind CSS',
  'ui.shadcn.com': 'shadcn/ui',
  'rust-lang.org': 'Rust',
  'go.dev': 'Go',
  'nodejs.org': 'Node.js',
  'python.org': 'Python',
  'better-auth.com': 'Better Auth',
  'workos.com': 'WorkOS',
  'auth0.com': 'Auth0',
  'newrelic.com': 'New Relic',
  'posthog.com': 'PostHog',
  'vercel.com': 'Vercel',
  'prisma.io': 'Prisma',
  'docs.convex.dev': 'Convex Docs', 'convex.dev': 'Convex',
  'redis.io': 'Redis',
  'better-auth.com': 'Better Auth',
  'cohere.com': 'Cohere',
  'cal.com': 'Cal.com',
  'mistral.ai': 'Mistral',
  'together.ai': 'Together AI',
  'amplitude.com': 'Amplitude',
  'datadog.com': 'Datadog',
  'mongodb.com': 'MongoDB',
  'supabase.com': 'Supabase',
  'cloudflare.com': 'Cloudflare',
  'svelte.dev': 'Svelte',
  'planetscale.com': 'PlanetScale',
};

// Acronyms that should stay uppercase if produced by humanizing.
const ACRONYMS = new Set(['ai', 'api', 'aws', 'cdn', 'cli', 'css', 'csv', 'db', 'fyi', 'gcp', 'hq', 'html', 'http', 'https', 'io', 'js', 'json', 'k8s', 'mcp', 'ml', 'oss', 'pdf', 'rpc', 'sdk', 'seo', 'sql', 'svg', 'tcp', 'tls', 'ts', 'ui', 'ux', 'xml', 'yaml']);

function looksLikeBrandH1(h1) {
  if (!h1) return false;
  if (h1.length > 40) return false;            // brand names are short
  if (/[.!?]/.test(h1)) return false;          // brand names aren't sentences
  if (/\s(is|are|the|a|for|with|by|of|to|that|which)\s/i.test(h1)) return false; // taglines
  if (/^https?:/i.test(h1)) return false;
  return true;
}

function humanizeDomain(domain) {
  // www.tinybird.co → Tinybird, docs.foo.com → Foo Docs (handled by override), foo-bar.com → Foo Bar
  const stripWww = domain.replace(/^www\./, '');
  const isDocsSub = /^(docs|developers?|api|platform)\./.test(stripWww);
  const root = stripWww.replace(/^(docs|developers?|api|platform)\./, '').split('.')[0];
  const parts = root.split(/[-_]/).filter(Boolean);
  const pretty = parts.map(p => {
    if (ACRONYMS.has(p.toLowerCase())) return p.toUpperCase();
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
  return isDocsSub ? pretty + ' Docs' : pretty;
}

function displayName(domain, parsed) {
  if (OVERRIDES[domain]) return OVERRIDES[domain];
  if (parsed && looksLikeBrandH1(parsed.h1)) return parsed.h1;
  return humanizeDomain(domain);
}

module.exports = { displayName, humanizeDomain, looksLikeBrandH1 };
