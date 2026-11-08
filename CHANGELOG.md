# Changelog

## 0.0.7 — 2026-11-08

### Changed

- Wording for the public: the page explains "phases" and "items" in one line under the heading, the verifiable record explains the signer, the SHA-256 and Walrus beside the facts, and its checking steps are a numbered list. The last step no longer says the signing address must be one "the operator has published" (nothing is published yet): it says to check the signer is the one you expect, and that an address shown only on the page cannot vouch for itself. A signed record whose document is not on Walrus now says so instead of claiming it was stored. The empty page no longer says "check back soon". `llms.txt` and the package description lost the word "operator".
- Dates in a phase window and in the record are `<time>` elements.
- Internal: takes `@meddleware/ui` ^0.1.40, `@meddleware/web-utils` ^0.0.4 and `@meddleware/frontend-config` ^0.0.7; the audit gate, the licence notices and the inline-script check are the shared `mw-audit-gate`, `mw-third-party-licenses` and `mw-check-csp-inline` (local copies and the script's test removed); `vite.config.ts`, `vitest.config.ts` and `tsconfig.json` use `meddlewareApp`, `vueTestConfig` and the shared tsconfig base (`tsconfig.build.json` removed); `mw-sync --check` runs in CI; `AGENTS.md` is a pointer to `CLAUDE.md`.

## 0.0.6 — 2026-11-06

### Changed

- Image base `static-server` 0.1.12 and the dev tools of the Dependabot groups merged on 2026-11-06.

## 0.0.5 — 2026-11-06

### Changed

- Takes `@meddleware/ui` ^0.1.39 (the tab list items use `role="none"`) and the Dependabot merges of 2026-11-06: image bases `static-server` 0.1.12 and a refreshed `node` build image, and newer dev tools.

## 0.0.4 — 2026-11-05

### Changed

- Dependency alignment: `@meddleware/ui` ^0.1.38 (form-field edge contrast, sticky-offset and focus-not-obscured fixes), `@meddleware/design-tokens` ^0.1.13, `@meddleware/web-utils` ^0.0.2 and `@meddleware/frontend-config` ^0.0.2.

## 0.0.3 — 2026-10-31

- Shared shell, tone badges, token-only styling and accessibility gates

## 0.0.2 — 2026-10-30

- The status filter is an even two-by-two grid on a phone (it wrapped into ragged rows with empty cells) and a single compact row from 36em.
- `npm run shots`: screenshots of every page state at phone and desktop width in both themes, for looking at the page.

## 0.0.1 — released 2026-10-30

- The release passes `VITE_SITE_DESCRIPTION` and `VITE_SITE_URL` from repository variables as well as the name.
- The roadmap page: phases and items with public wording, status words and symbols, public dates in the visitor's time
  zone, a status filter, loading / error-with-retry / empty states, and the verifiable record of the signed snapshot.
- Defensive parsers for the two same-origin public routes (only displayed fields survive; malformed items are dropped).
- Link-preview tags (title, description, Open Graph, Twitter) in the static HTML from build arguments
  (`VITE_SITE_NAME`, `VITE_SITE_DESCRIPTION`, `VITE_SITE_URL`).
- Tests: parser, dates, page states, hostile text; Chromium tests under the production CSP (flows, link-preview tags,
  phone width, axe in every theme and season); `check:dist`.
- Page shell (header, heading, footer) on static-server with a same-origin CSP; generic `robots.txt` and `llms.txt`.
