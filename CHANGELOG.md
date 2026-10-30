# Changelog

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
