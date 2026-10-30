// The built site in Chromium against mocked public routes, under the production CSP, with no network. What these prove
// beyond the component tests: the real fetch path, the CSP, the page at phone width, the link-preview tags a crawler
// reads, and that nothing internal in a response reaches the screen.
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { SIGNER, empty, noSnapshot, roadmap, snapshotResponse } from '../tests/support/fixtures.js'

type Body = unknown
async function open(page: Page, routes: { roadmap?: Body | number; snapshot?: Body | number } = {}) {
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
  return { problems, requested }
}

test('shows the public roadmap, and only public wording', async ({ page }) => {
  const { problems, requested } = await open(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roadmap')
  await expect(page.getByRole('heading', { level: 2, name: 'Foundations' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Mint opens' })).toBeVisible()
  await expect(page.getByText('Planned for').first()).toBeVisible()
  const body = await page.locator('body').innerText()
  for (const leaked of ['SECRET', 'phase-1', 'internal_name', 'visible_bot']) expect(body).not.toContain(leaked)
  expect([...new Set(requested)].sort()).toEqual(['/public/v1/roadmap', '/public/v1/snapshot'])
  expect(problems).toEqual([])
})

test('filters, and shows the verifiable record', async ({ page }) => {
  const { problems } = await open(page)
  await page.getByText('Done', { exact: true }).click()
  await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Open the testnet'])
  await page.getByText('Everything').click()
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3)
  await page.getByText('Verifiable record of this roadmap').click()
  await expect(page.getByText(SIGNER)).toBeVisible()
  await expect(page.getByRole('link', { name: /Qc9aP0V6x3mYk2w1/ })).toHaveAttribute('href', /^https:\/\/aggregator\.example\.org\/v1\/blobs\//)
  expect(problems).toEqual([])
})

test('an empty roadmap and a failing server each say so', async ({ page }) => {
  await open(page, { roadmap: empty, snapshot: noSnapshot })
  await expect(page.getByText('Nothing has been published yet')).toBeVisible()
  await expect(page.getByText('Verifiable record')).toHaveCount(0)

  const failing = await page.context().newPage()
  await open(failing, { roadmap: 503 })
  await expect(failing.getByRole('alert')).toContainText('could not be loaded')
  await failing.unroute('**/public/v1/**')
  await failing.route('**/public/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(route.request().url().endsWith('/roadmap') ? roadmap : noSnapshot) }),
  )
  await failing.getByRole('button', { name: 'Try again' }).click()
  await expect(failing.getByRole('heading', { level: 2, name: 'Foundations' })).toBeVisible()
})

test('a hostile response is shown as text', async ({ page }) => {
  const hostile = structuredClone(roadmap)
  hostile.phases[0]!.items[0]!.title = '<img src=x onerror="window.pwned=1">'
  hostile.phases[0]!.items[0]!.description = '[go](javascript:window.pwned=2)'
  const { problems } = await open(page, { roadmap: hostile })
  await expect(page.getByRole('heading', { level: 3, name: '<img src=x onerror="window.pwned=1">' })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)).toBeUndefined()
  await expect(page.locator('main img')).toHaveCount(0)
  await expect(page.locator('main a[href^="javascript:"]')).toHaveCount(0)
  expect(problems).toEqual([])
})

test('the built page carries the tags a link preview reads', async ({ page, request }) => {
  await open(page)
  const html = await (await request.get('/')).text()
  expect(html).toMatch(/<title>Roadmap<\/title>/)
  expect(html).toMatch(/<meta property="og:title" content="Roadmap"/)
  expect(html).toMatch(/<meta property="og:description" content="[^"]+"/)
  expect(html).toMatch(/<meta name="twitter:card" content="summary"/)
  expect(html).not.toMatch(/noindex/i)
  // Not baked: no canonical link or og:url without a configured address.
  expect(html).not.toMatch(/rel="canonical"|og:url/)
})

test('fits a phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  const { problems } = await open(page)
  await page.getByText('Verifiable record of this roadmap').click()
  await expect(page.getByText(SIGNER)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  expect(problems).toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
    test(`no axe violations (${theme} · ${season})`, async ({ page }) => {
      await open(page)
      await expect(page.getByRole('heading', { level: 2, name: 'Foundations' })).toBeVisible()
      await page.evaluate(([t, s]) => {
        document.documentElement.setAttribute('data-theme', t)
        document.documentElement.setAttribute('data-season', s)
      }, [theme, season])
      await page.getByText('Verifiable record of this roadmap').click()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
      const summary = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 4).map((n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n').slice(0, 3).join(' | ')}`) }))
      expect(summary, JSON.stringify(summary, null, 2)).toEqual([])
    })
  }
}
