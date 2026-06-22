#!/usr/bin/env node
/**
 * Regenerate index.json: walk each template dir, compute per-file sha256,
 * emit raw.githubusercontent URLs. Run after editing any template:
 *   node scripts/build-index.mjs
 */
import { createHash } from 'node:crypto'
import { readFileSync, statSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAW = 'https://raw.githubusercontent.com/founderplus-labs/founderplus-templates/main'

// Per-template metadata. Add an entry here when you add a template dir.
const META = {
  'static-landing': {
    title: 'Static Landing + Checkout',
    description:
      'No-build sell page: one HTML file + funnel-tracker.js buy button. Founder+ handles payment. Zero server. Lowest friction — deploy with fp sites publish.',
    runtime: 'static',
    stack: ['html', 'no-build'],
    postInstall: ['Edit index.html (slug + copy)', 'fp sites publish index.html'],
    setupDoc: 'SETUP.md'
  },
  'lead-magnet': {
    title: 'Lead Magnet Capture',
    description:
      'No-build capture page: one HTML file + funnel-tracker.js lead form (data-lead-magnet). Email/WhatsApp gate, asset (PDF/sheet) emailed on submit, UTM captured. Founder+ handles signup + delivery. Deploy with fp sites publish.',
    runtime: 'static',
    stack: ['html', 'no-build'],
    postInstall: ['Edit index.html (asset uuid + copy)', 'fp sites publish index.html'],
    setupDoc: 'SETUP.md'
  },
  'ai-studio': {
    title: 'AI Studio Prompt Pack',
    description:
      'Product-specific prompts for Google AI Studio that generate a static selling page pre-wired to the Founder+ CDN checkout. Ebook, course, event, and freemium Gemini tool. No build, no payment code.',
    runtime: 'static',
    stack: ['google-ai-studio', 'static', 'cdn'],
    postInstall: ['Pick a prompt in prompts/', 'Fill placeholders + paste into AI Studio', 'Read SETUP.md'],
    setupDoc: 'SETUP.md'
  },
  'fp-fullstack': {
    title: 'Founder+ Fullstack Starter',
    description:
      'Paywalled fullstack app: Founder+ login + product entitlement gate + checkout (no payment code). TanStack Start + Cloudflare + Tailwind. Owner access built in.',
    runtime: 'node',
    stack: ['tanstack-start', 'cloudflare-workers', 'tailwind', 'react19'],
    postInstall: ['cp .env.example .env', 'npm install', 'Read SETUP.md'],
    setupDoc: 'SETUP.md',
    securityDoc: 'SECURITY.md'
  },
  astro: {
    title: 'Founder+ Astro Starter',
    description:
      'Astro SSR on Cloudflare with Founder+ login + product gate + checkout. Vendored auth, owner access. Great for content + interactive islands.',
    runtime: 'node',
    stack: ['astro', 'cloudflare-workers'],
    postInstall: ['cp .env.example .env', 'npm install', 'Read SETUP.md'],
    setupDoc: 'SETUP.md',
    securityDoc: 'SECURITY.md'
  },
  nextjs: {
    title: 'Founder+ Next.js Starter',
    description:
      'Next.js App Router with Founder+ login + product gate + checkout. Server Component gate, owner access. Runs on Node / Vercel.',
    runtime: 'node',
    stack: ['nextjs', 'react19', 'node'],
    postInstall: ['cp .env.example .env', 'npm install', 'Read SETUP.md'],
    setupDoc: 'SETUP.md',
    securityDoc: 'SECURITY.md'
  },
  hono: {
    title: 'Founder+ Hono Starter',
    description:
      'Minimal edge app: Hono on Cloudflare Workers with Founder+ login + product gate + checkout. JSX HTML, no client framework, owner access.',
    runtime: 'node',
    stack: ['hono', 'cloudflare-workers'],
    postInstall: ['npm install', 'Set FOUNDERPLUS_PRODUCT_SLUG in wrangler.jsonc', 'Read SETUP.md'],
    setupDoc: 'SETUP.md',
    securityDoc: 'SECURITY.md'
  }
}

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.astro', '.next', '.vercel', '.wrangler'
])

function walk(dir, root) {
  let out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) out = out.concat(walk(p, root))
    else out.push(relative(root, p))
  }
  return out
}

const templates = Object.entries(META).map(([name, meta]) => {
  const files = walk(name, name)
    .sort()
    .map((p) => {
      const buf = readFileSync(join(name, p))
      return {
        path: p,
        url: `${RAW}/${name}/${p}`,
        digest: 'sha256:' + createHash('sha256').update(buf).digest('hex'),
        size: statSync(join(name, p)).size
      }
    })
  return { name, ...meta, files }
})

const idx = {
  $schema: 'https://founderplus.id/schemas/agent-templates/v0.1.0.json',
  version: '0.1.0',
  repo: 'founderplus-labs/founderplus-templates',
  publisher: { name: 'Founder+', url: 'https://founderplus.id' },
  templates
}

writeFileSync('index.json', JSON.stringify(idx, null, 2) + '\n')
console.log(`index.json written — ${templates.length} template(s), ${templates.reduce((n, t) => n + t.files.length, 0)} files`)
