# AGENTS.md — roadmap-site

## Layout

```text
src/main.ts            bootstrap (tokens, seasons, the ui reset, App)
src/App.vue            the page shell (UiAppShell, header with the colour-mode control, footer)
src/RoadmapView.vue    loads the two public routes; loading / error / empty states; the filter (UiSegmentedControl)
src/lib/roadmap.ts     the response parsers (the boundary), status labels, tones and symbols, filtering
src/components/        PhaseSection, ItemCard (a UiCard with a UiBadge), SnapshotNote (CopyableAddress, ExplorerLink)
vite.config.ts         the meta plugin (title, description, Open Graph from build arguments) and the preview CSP
tests/, e2e/           unit and component tests; browser tests (tests/support/fixtures.ts is shared; e2e/open.ts mocks the routes; a11y.spec.ts is the shared accessibility sweep)
lighthouserc.cjs       Lighthouse CI (accessibility 100, best practices, bundle budgets)
public/                favicon, generic robots.txt and llms.txt (a deployment replaces both)
```

## Commands

```bash
npm ci && npm run type-check && npm run lint && npm test && npm run build && npm run check:csp && npm run check:dist && npm run check:licenses
npx playwright install chromium && npm run test:e2e   # E2E_BROWSERS=all for the five browser projects
npm run lhci
docker build -t roadmap-site:ci . && bash scripts/smoke.sh roadmap-site:ci
```
