# roadmap-site

The public roadmap of a content hub: the phases and items an operator has made public, with their status. A Vue 3
site on `@meddleware/ui`, served by static-server. Data: `GET /public/v1/roadmap` on the same host, which the
ingress routes to the hub's public process ([content-hub-service](https://github.com/meddleware-org/content-hub-service)).

**Status (0.0.1):** the roadmap page works against the hub's public routes.

- **What it shows:** phases (public name, description, date window) and their items (title, description, status as a word
  with a symbol, the public date), with a status filter, loading / error-with-retry / empty states, and, when the hub has
  produced one, a **verifiable record** (the roadmap's signed snapshot on Walrus: signer address, SHA-256, signature,
  blob link, and how to verify it).
- **Only public data, only two same-origin routes:** `GET /public/v1/roadmap` and `GET /public/v1/snapshot`. The parser
  keeps only the fields it shows, so nothing else in a response (even an internal field that leaked into one) can reach
  the page; a malformed item is dropped, not fatal. No task detail exists in the response and the site never asks for any.
- **Untrusted text is text:** no `v-html` anywhere.
- **Link previews and search:** the title, description and Open Graph / Twitter tags are in the static HTML from build
  arguments (crawlers do not run the page's script); the canonical link and `og:url` appear when `VITE_SITE_URL` is set.
- **Accessible and small:** semantic landmarks, statuses are words first, WCAG 2.2 AA in every theme and season (axe in the
  browser tests), works at phone width, about 31 kB of JavaScript gzipped.

## Build-time configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_SITE_NAME` | `Roadmap` | name in the header, the page heading, the title and link previews |
| `VITE_SITE_DESCRIPTION` | a generic sentence | the description in search results and link previews |
| `VITE_SITE_URL` | unset | the public https address; adds the canonical link and `og:url` |

`robots.txt` and `llms.txt` in `public/` are generic defaults; a deployment replaces them with its own.

## Development

```bash
npm ci
npm run dev            # http://localhost:5173, /public proxied to a local `content-hub public` on :8080
npm run type-check && npm run lint && npm test && npm run build && npm run check:csp && npm run check:dist
npx playwright install chromium && npm run test:e2e   # the built page in a browser, mocked routes, production CSP, axe
docker build -t roadmap-site:dev . && bash scripts/smoke.sh roadmap-site:dev
```

## Walrus Site

A plan for publishing the same build as a verifiable Walrus Site (mainnet-gated, nothing published): [docs/WALRUS_SITE.md](docs/WALRUS_SITE.md).

## Licence

0BSD — see [LICENSE](LICENSE).
