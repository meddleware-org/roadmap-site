#!/usr/bin/env node
// The built site is a public page: it must carry its link-preview tags, and no test support.
//
//   node scripts/check-dist.mjs dist
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error('usage: check-dist.mjs <dist directory>')
  process.exit(2)
}
const FORBIDDEN = [/tests\/support/, /__TEST__/, /@playwright/, /vitest/, /fixtures\.js/]
const files = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : [join(d, n)]))
const problems = []
let n = 0
for (const f of files(dir)) {
  if (!/\.(js|mjs|css|html|map|json)$/.test(f)) continue
  n++
  const text = readFileSync(f, 'utf8')
  for (const re of FORBIDDEN) if (re.test(text)) problems.push(`${f}: matches ${re}`)
}
if (n === 0) problems.push(`${dir} has no built files`)
const index = readFileSync(join(dir, 'index.html'), 'utf8')
for (const [what, re] of [
  ['a <title>', /<title>[^<]+<\/title>/],
  ['a description', /<meta name="description" content="[^"]+"/],
  ['og:title', /<meta property="og:title" content="[^"]+"/],
  ['og:description', /<meta property="og:description" content="[^"]+"/],
  ['og:type', /<meta property="og:type" content="website"/],
  ['twitter:card', /<meta name="twitter:card"/],
]) {
  if (!re.test(index)) problems.push(`index.html lacks ${what}`)
}
if (/<meta[^>]+name="robots"[^>]+noindex/i.test(index)) problems.push('a public page must not be noindex')
if (index.includes('<!-- @meta -->')) problems.push('the meta placeholder was not replaced')
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${dir}: ${n} files, link-preview tags present, no test support`)
