// Screenshots for LOOKING at the page (see @meddleware/frontend-config/shots). Run: npm run shots. The states below are this site's own:
// they reach the record, the filter, the empty page and the error page through mocked public routes (no network), which a bare route
// visit cannot.
import { defineShots } from '@meddleware/frontend-config/shots'
import { empty, noSnapshot } from '../tests/support/fixtures.js'
import { open } from './open.js'

defineShots({
  roadmap: async (page) => void (await open(page)),
  'record-open': async (page) => {
    await open(page)
    await page.getByText('Verifiable record of this roadmap').click()
  },
  'filter-done': async (page) => {
    await open(page)
    await page.getByText('Done', { exact: true }).click()
  },
  empty: async (page) => void (await open(page, { roadmap: empty, snapshot: noSnapshot })),
  error: async (page) => void (await open(page, { roadmap: 503 })),
})
