# CLAUDE.md — roadmap-site

The public roadmap site. See [README.md](README.md).

## Invariants

- **Public data only, from two routes.** The site reads `GET /public/v1/roadmap` and `GET /public/v1/snapshot` on its own
  host and nothing else (`connect-src 'self'`). Those responses are built by the hub from public views that contain only
  public wording; the site shows no task detail and never asks for more.
- **The parser is the boundary.** `src/lib/roadmap.ts` keeps only the fields the page shows and drops what is malformed or
  unknown; nothing renders from a raw response. A change to what the page shows is a change to the parser first.
- **The snapshot note is a bonus.** Its absence or failure never affects the roadmap.
- **Statuses are words first** (`UiBadge`: body-colour text, a symbol and a border; the tone and symbol per status are in `src/lib/roadmap.ts`); colour only reinforces.
- **Nothing here re-implements a ui or web-utils piece.** Cards, badges, the filter, the empty and loading text, the copy buttons and explorer links are `@meddleware/ui`; dates, the bounded fetch and the explorer URL are `@meddleware/web-utils`. The site's own code is the parser, the labels and the page.
- **Link previews come from the static HTML** (the meta plugin in `vite.config.ts`, from build arguments), not from script.
- **Untrusted text is text.** Titles and descriptions are rendered as text (`{{ }}`), never with `v-html`.
- **No deployment-specific data** in the repository: the site name is a build argument; `robots.txt`/`llms.txt` are generic
  defaults a deployment replaces.
- **Words for the public (D117).** The page says "phase", "item", "signer" and "SHA-256" only with a one-line explanation beside them, never "operator", a build variable, a script name or a placeholder; "Meddleware" is the one spelling. The verification steps in `SnapshotNote.vue` match the hub's `docs/SNAPSHOT.md` (fetch the blob, compare the SHA-256, verify the personal-message signature, check the signer is the one you expect); the signer address shown is public data from the hub and is never hard-coded here.
- **`AppToolShell`, without its extras.** The page uses the shared shell for the header (the Meddleware mark beside the deployment's name, `title` = `VITE_SITE_NAME`, default "Roadmap"), the colour-mode control and the footer with the copyright line. It passes `:page-heading="false"` (the page has its own visible `h1`, named by the deployment) and `:docs-url="false" :dev-url="false"` (a public page has no documentation pages, so the footer has no docs or developer link).
- Fleet UI rules: semantic markup (one `h1`, content in `main`), no inline styles, design-token colours only,
  html-validate and the a11y lint gate.

## Layout

```text
src/main.ts            bootstrap (tokens, seasons, the ui reset, App)
src/App.vue            the page shell (AppToolShell: mark and site name, colour-mode control, footer; the page's own h1)
src/RoadmapView.vue    loads the two public routes; loading / error / empty states; the filter (UiSegmentedControl)
src/lib/roadmap.ts     the response parsers (the boundary), status labels, tones and symbols, filtering
src/components/        PhaseSection, ItemCard (a UiCard with a UiBadge), SnapshotNote (CopyableAddress, ExplorerLink)
vite.config.ts         `meddlewareApp` (frontend-config; `name` = the deployment's name, which names the web manifest and emits the brand icon set: favicon, apple-touch-icon, 192/512 icons, `site.webmanifest`, links injected, so no `public/favicon.*` and no icon `<link>`) plus the meta plugin (title, description, Open Graph from build arguments) and the preview CSP
tests/, e2e/           unit and component tests; browser tests (tests/support/fixtures.ts is shared; e2e/open.ts mocks the routes; a11y.spec.ts is the shared accessibility sweep)
lighthouserc.cjs       Lighthouse CI (accessibility 100, best practices, bundle budgets)
public/                generic robots.txt and llms.txt (a deployment replaces both); no icon: the brand icon set is generated
```

Shared tooling comes from `@meddleware/frontend-config`: `mw-audit-gate`, `mw-third-party-licenses`, `mw-check-csp-inline` (CSP profile `static-strict`, set in package.json `"meddleware"`), `mw-sync` (keeps `.dockerignore`, the lint configs, `dependabot.yml`, the allowlist and the Dockerfile CSP aligned: `npx mw-sync --check`).

## Commands

```bash
npm ci && npm run type-check && npm run lint && npm test && npm run build && npm run check:csp && npm run check:dist && npx vitest run tests/dist.test.ts && npm run check:licenses && npx mw-sync --check
npx playwright install chromium && npm run test:e2e   # E2E_BROWSERS=all for the five browser projects
npm run lhci
docker build -t roadmap-site:ci . && bash scripts/smoke.sh roadmap-site:ci
```

## Looking at it

`npm run shots` (Playwright, the built page, mocked routes) writes a PNG per state (roadmap, record open, filtered, empty, error),
viewport (phone, tablet, desktop; every colour mode × season at desktop) to `test-results/shots/` (`SHOTS_OUT` to change it): open them and look. It found the status filter wrapping
into ragged rows on a phone (now an even two-by-two grid below 36em). Nothing is compared to a baseline.

## Tests

`npm test` (vitest): the parser (what is kept, dropped and bounded), dates, every state of the page against a mocked
fetch (loading, rendered, filter, empty, error and retry, timeout, hostile text, the snapshot note, only two routes and no
credentials), design tokens, the wording for the public. `npm run test:e2e` (Playwright, the built page, production CSP,
mocked routes): flows, link-preview tags, phone width, and the shared accessibility sweep (`e2e/a11y.spec.ts`, from `@meddleware/frontend-config/a11y`): axe at WCAG 2.2 AA and AAA (gating) in every colour mode × season for the roadmap, its record open, the empty page and the error page, then reflow at 320 px, 200% text, forced colours, reduced motion and the keyboard. `E2E_BROWSERS=all` runs five browsers (CI does). `npm run lhci`: Lighthouse (accessibility 100). `npm run check:dist`:
link-preview tags present, no test support (`scripts/check-dist.mjs`, specific to this site). `scripts/smoke.sh` probes the built image.
