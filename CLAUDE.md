# CLAUDE.md — roadmap-site

The public roadmap site. See [README.md](README.md).

## Invariants

- **Public data only, from two routes.** The site reads `GET /public/v1/roadmap` and `GET /public/v1/snapshot` on its own
  host and nothing else (`connect-src 'self'`). Those responses are built by the hub from public views that contain only
  public wording; the site shows no task detail and never asks for more.
- **The parser is the boundary.** `src/lib/roadmap.ts` keeps only the fields the page shows and drops what is malformed or
  unknown; nothing renders from a raw response. A change to what the page shows is a change to the parser first.
- **The snapshot note is a bonus.** Its absence or failure never affects the roadmap.
- **Statuses are words first** (`StatusPill`: body-colour text, a symbol and a border); colour only reinforces.
- **Link previews come from the static HTML** (the meta plugin in `vite.config.ts`, from build arguments), not from script.
- **Untrusted text is text.** Titles and descriptions are rendered as text (`{{ }}`), never with `v-html`.
- **No operator data** in the repository: the site name is a build argument; `robots.txt`/`llms.txt` are generic
  defaults a deployment replaces.
- Fleet UI rules: semantic markup (one `h1`, content in `main`), no inline styles, design-token colours only,
  html-validate and the a11y lint gate.

## Looking at it

`npm run shots` (Playwright, the built page, mocked routes) writes a PNG per state (roadmap, record open, filtered, empty, error),
viewport (phone 390, desktop 1280) and theme to `test-results/screens/`: open them and look. It found the status filter wrapping
into ragged rows on a phone (now an even two-by-two grid below 36em). Nothing is compared to a baseline.

## Tests

`npm test` (vitest): the parser (what is kept, dropped and bounded), dates, every state of the page against a mocked
fetch (loading, rendered, filter, empty, error and retry, timeout, hostile text, the snapshot note, only two routes and no
credentials), design tokens, the CSP inline-script check. `npm run test:e2e` (Playwright, the built page, production CSP,
mocked routes): flows, link-preview tags, phone width, axe in both themes and all four seasons. `npm run check:dist`:
link-preview tags present, no test support. `scripts/smoke.sh` probes the built image.
