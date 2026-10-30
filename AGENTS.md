# AGENTS.md — roadmap-site

## Layout

```text
src/main.ts            bootstrap (styles, App)
src/App.vue            the page shell
src/RoadmapView.vue    loads the two public routes; loading / error / empty states; filter
src/lib/roadmap.ts     the response parsers (the boundary), status labels, filtering
src/lib/format.ts      dates in the visitor's time zone
src/components/        PhaseSection, ItemCard, StatusPill, StatusFilter, SnapshotNote
vite.config.ts         the meta plugin (title, description, Open Graph from build arguments) and the preview CSP
tests/, e2e/           unit and component tests; browser tests (tests/support/fixtures.ts is shared)
public/                favicon, generic robots.txt and llms.txt (a deployment replaces both)
```

## Commands

```bash
npm ci && npm run type-check && npm run lint && npm test && npm run build && npm run check:csp && npm run check:dist && npm run check:licenses
npx playwright install chromium && npm run test:e2e
docker build -t roadmap-site:ci . && bash scripts/smoke.sh roadmap-site:ci
```
