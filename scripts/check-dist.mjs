#!/usr/bin/env node
// The built site is a public page: it must carry its link-preview tags and the brand icon set, and no test support.
//
//   node scripts/check-dist.mjs dist
// File-system helpers to walk the build folder.
import { readdirSync, readFileSync, statSync } from 'node:fs'
// Path joining.
import { join } from 'node:path'

// The folder to check (the build output).
const dir = process.argv[2]
// A missing argument is a usage error (exit status 2).
if (!dir) {
  console.error('usage: check-dist.mjs <dist directory>')
  process.exit(2)
}
// Names that mean test support reached the build.
const FORBIDDEN = [/tests\/support/, /__TEST__/, /@playwright/, /vitest/, /fixtures\.js/]
// Every file under a folder, recursively.
const files = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : [join(d, n)]))
// The problems found.
const problems = []
// How many files were read.
let n = 0
// Read every text-like file in the build.
for (const f of files(dir)) {
  if (!/\.(js|mjs|css|html|map|json)$/.test(f)) continue
  n++
  const text = readFileSync(f, 'utf8')
  for (const re of FORBIDDEN) if (re.test(text)) problems.push(`${f}: matches ${re}`)
}
// An empty build would pass trivially, so it is a problem too.
if (n === 0) problems.push(`${dir} has no built files`)
// The brand icon set the theme provides must all be there.
for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
  if (!statSync(join(dir, f), { throwIfNoEntry: false })?.isFile()) problems.push(`${dir}/${f} is missing (the brand icon set)`)
}
// The built index.html.
const index = readFileSync(join(dir, 'index.html'), 'utf8')
// The link-preview tags a public page must carry.
for (const [what, re] of [
  ['a <title>', /<title>[^<]+<\/title>/],
  ['a description', /<meta name="description" content="[^"]+"/],
  ['og:title', /<meta property="og:title" content="[^"]+"/],
  ['og:description', /<meta property="og:description" content="[^"]+"/],
  ['og:type', /<meta property="og:type" content="website"/],
  ['twitter:card', /<meta name="twitter:card"/],
  ['the web manifest link', /<link rel="manifest"/],
]) {
  if (!re.test(index)) problems.push(`index.html lacks ${what}`)
}
// Exactly one svg icon link.
if ((index.match(/<link rel="icon"[^>]*type="image\/svg\+xml"/g) ?? []).length !== 1) problems.push('index.html must carry exactly one svg icon link')
// A public page must not be noindex.
if (/<meta[^>]+name="robots"[^>]+noindex/i.test(index)) problems.push('a public page must not be noindex')
// The placeholder must have been replaced.
if (index.includes('<!-- @meta -->')) problems.push('the meta placeholder was not replaced')
// Any problem fails the check.
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${dir}: ${n} files, link-preview tags and the brand icon set present, no test support`)
