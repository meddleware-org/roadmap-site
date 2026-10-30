// Screenshots for LOOKING at the page (not assertions): `npm run shots` writes PNGs to test-results/screens/, one per state,
// viewport and theme, so layout, spacing, contrast and wording problems that no assertion catches can be seen. Excluded from
// `npm run test:e2e`; nothing is compared against a baseline (baselines drift across machines and fonts).
import { test, type Page } from '@playwright/test'
import { empty, noSnapshot, roadmap, snapshotResponse } from '../tests/support/fixtures.js'

const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 900 } } as const
const THEMES = ['light', 'dark'] as const
type Body = unknown

async function open(page: Page, routes: { roadmap?: Body | number; snapshot?: Body | number } = {}) {
  await page.route(/^https?:\/\/(?!(localhost|127\.0\.0\.1)[:/])/, (route) => route.abort())
  await page.route('**/public/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    const spec = path.endsWith('/roadmap') ? (routes.roadmap ?? roadmap) : (routes.snapshot ?? snapshotResponse)
    if (typeof spec === 'number') return route.fulfill({ status: spec, body: 'down' })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(spec) })
  })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).waitFor()
}

const STATES: Record<string, (page: Page) => Promise<void>> = {
  roadmap: async (page) => open(page),
  'record-open': async (page) => {
    await open(page)
    await page.getByText('Verifiable record of this roadmap').click()
  },
  'filter-done': async (page) => {
    await open(page)
    await page.getByText('Done', { exact: true }).click()
  },
  empty: async (page) => open(page, { roadmap: empty, snapshot: noSnapshot }),
  error: async (page) => open(page, { roadmap: 503 }),
}

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    for (const [name, go] of Object.entries(STATES)) {
      test(`${name} · ${vpName} · ${theme}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.emulateMedia({ colorScheme: theme })
        await go(page)
        // Use the real control (as a visitor would) so its own state matches the page.
        await page.getByRole('button', { name: theme === 'dark' ? /dark/i : /light/i }).first().click()
        await page.screenshot({ path: `test-results/screens/${name}.${vpName}.${theme}.png`, fullPage: true })
      })
    }
  }
}
