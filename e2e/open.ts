// Opens the built site with its two public routes mocked (page.route), so a run needs no network. Every request that leaves localhost
// is refused. Returns what the page reported (uncaught errors, CSP violations) and which public routes it asked for.
import type { Page } from '@playwright/test'
import { roadmap, snapshotResponse } from '../tests/support/fixtures.js'

export type Body = unknown
export interface Routes {
  roadmap?: Body | number
  snapshot?: Body | number
}

export async function open(page: Page, routes: Routes = {}) {
  const problems: string[] = []
  const requested: string[] = []
  page.on('pageerror', (e) => problems.push(`error: ${e.message}`))
  page.on('console', (m) => {
    if (/content security policy|refused to/i.test(m.text())) problems.push(`csp: ${m.text()}`)
  })
  await page.route(/^https?:\/\/(?!(localhost|127\.0\.0\.1)[:/])/, (route) => route.abort())
  await page.route('**/public/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    requested.push(path)
    const spec = path.endsWith('/roadmap') ? (routes.roadmap ?? roadmap) : (routes.snapshot ?? snapshotResponse)
    if (typeof spec === 'number') return route.fulfill({ status: spec, body: 'down' })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(spec) })
  })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).waitFor()
  // The page has settled when the roadmap, the empty message or the error is on it.
  await page.getByRole('heading', { level: 2 }).first().or(page.getByRole('alert')).or(page.getByText('Nothing has been published yet')).first().waitFor()
  return { problems, requested }
}
