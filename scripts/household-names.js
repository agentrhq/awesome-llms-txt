'use strict';

// Curated set of "household-name" domains that drive the "Names you know"
// section on the GitHub Pages index and the top-level README.
//
// Editorial. To propose a change, open an issue with the `household-names`
// label. One entry per brand — pick whichever subdomain the brand uses as
// their primary llms.txt location.
const HOUSEHOLD_NAMES = new Set([
  'docs.stripe.com',
  'vercel.com',
  'docs.anthropic.com',
  'cohere.com',
  'cloudflare.com',
  'github.com',
  'resend.com',
  'linear.app',
  'cal.com',
  'clerk.com',
  'workos.com',
  'auth0.com',
  'posthog.com',
  'neon.tech',
  'docs.convex.dev',
  'supabase.com',
  'datadog.com',
  'mongodb.com',
  'redis.io',
  'netlify.com',
  'twilio.com',
  'notion.so',
  'python.langchain.com',
  'docs.zapier.com',
  'docs.expo.dev',
  'docs.adyen.com',
  'docs.docker.com',
  'prisma.io',
  'planetscale.com',
  'nextjs.org',
  'react.dev',
  'svelte.dev',
  'vuejs.org',
  'ui.shadcn.com',
  'amplitude.com',
  'newrelic.com',
  'elevenlabs.io',
  'replicate.com',
  'better-auth.com',
  'www.unkey.com',
  'mistral.ai',
  'together.ai',
  'ollama.com',
  'docs.gitbook.com',
  'www.mux.com',
]);

module.exports = { HOUSEHOLD_NAMES };
