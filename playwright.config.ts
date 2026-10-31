import { definePlaywrightConfig } from '@meddleware/frontend-config/playwright'

// Browser tests of the BUILT site against mocked public routes (page.route): `npm run test:e2e` builds, serves dist with `vite preview`
// under the production CSP, and drives Chromium locally (E2E_BROWSERS=all for the five browser projects CI runs). Every request that
// leaves localhost is refused, so the run needs no network. The screenshot capture (`npm run shots`) is for looking, not asserting.
export default definePlaywrightConfig({ port: 4292 })
