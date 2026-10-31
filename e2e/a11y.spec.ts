// The accessibility sweep (WCAG 2.2 AA and AAA in every colour mode × season, reflow, text size, forced colours, reduced motion,
// keyboard) over each state of the page: the roadmap, its record open, an empty one and the error page.
import { defineA11ySuite } from '@meddleware/frontend-config/a11y'
import { empty, noSnapshot } from '../tests/support/fixtures.js'
import { open } from './open.js'

defineA11ySuite(
  {
    roadmap: async (page) => void (await open(page)),
    'record open': async (page) => {
      await open(page)
      await page.getByText('Verifiable record of this roadmap').click()
    },
    empty: async (page) => void (await open(page, { roadmap: empty, snapshot: noSnapshot })),
    error: async (page) => void (await open(page, { roadmap: 503 })),
  },
  { aaa: 'gate' },
)
