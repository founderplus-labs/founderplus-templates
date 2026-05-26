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
  'fp-fullstack': {
    title: 'Founder+ Fullstack Starter',
    description:
      'Paywalled fullstack app: Founder+ login + product entitlement gate + checkout (no payment code). TanStack Start + Cloudflare + Tailwind. Owner access built in.',
    runtime: 'node',
    stack: ['tanstack-start', 'cloudflare-workers', 'tailwind', 'react19'],
    postInstall: ['cp .env.example .env', 'npm install', 'Read SETUP.md'],
    setupDoc: 'SETUP.md',
    securityDoc: 'SECURITY.md'
  }
}

function walk(dir, root) {
  let out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue
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
