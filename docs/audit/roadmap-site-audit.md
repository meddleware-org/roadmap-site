# Security Audit — `roadmap-site`

**Classification:** Internal security review
**Project:** repos/roadmap-site (the public roadmap page of a content hub)
**Project type:** Vue app (static site)
**Template:**

- AUDIT_TEMPLATE.md (2026-11-01)
- AUDIT_TEMPLATE_TS.md (2026-11-01)
- AUDIT_TEMPLATE_VUE.md (2026-11-01)
- AUDIT_TEMPLATE_IMG.md (2026-10-08)
- AUDIT_TEMPLATE_A11Y.md (2026-11-01)

**Package manager / lockfile:** npm 11, package-lock.json committed
**Module format:** ESM
**Publish model:** not published to npm (image only)
**Runtime targets:** browser
**Peer dependencies:** none
**Build tool:** vite 8, @vitejs/plugin-vue 6, vue 3.5
**Hosting:** static-server 0.1.11 image
**Embedding hosts:** none
**VITE_* inventory:** VITE_SITE_NAME, VITE_SITE_DESCRIPTION, VITE_SITE_URL
**Images:** quay.io/meddleware-org/roadmap-site (0.0.2)
**Base images:** node:26-slim@sha256:0d1e3358… (build, $BUILDPLATFORM) · static-server:0.1.11@sha256:94685b94… (runtime)
**Runtime user:** 65534   **Runtime FS:** read-only
**Deployed by:** the instance's `post-bootstrap/content-hub/` (C9)
**Build args:** VITE_SITE_NAME, VITE_SITE_DESCRIPTION, VITE_SITE_URL — not secret
**Deployment status:** *(Latest, 2026-11-07 last batch: `0.0.6` is released (CI green, signed) and deployed; pinned `sha256:ddf37294…371d` by consensus, the running pods' image digest equals it. It takes the `static-server` 0.1.12 base and the merged dev tools.)* *(Latest, 2026-11-06 follow-up wave: `0.0.5` is released (CI green, signed) and deployed; pinned `sha256:508217f3…254a` by consensus, the running pods' image digest equals it. It takes `@meddleware/ui` 0.1.39 where the app uses it and the Dependabot merges of 2026-11-06 (image bases, dev tools).)* *(Current, 2026-11-05: `0.0.4` is released (image, CI green, signed) and deployed; `config/images.yaml` pins `sha256:39b3d734…c824` by consensus (quay.io and Docker Hub agree, cosign valid) and the running pod's image digest equals it; the public host answers 200 and the rendered footer links to `https://meddleware.co.uk/legal/`. The text below is the earlier history, kept as written.)* live on testnet (R2, 2026-10-30); 0.0.2 released, pinned by consensus (cosign valid) and deployed 2026-10-30
**Review date:** 2026-10-29; 0.0.2 re-verified 2026-10-30 against screenshots (filter layout on phones fixed; deployed); 0.0.3 released 2026-10-31 (Shared shell, tone badges, token-only styling and accessibility gates); frontend-wave delta review 2026-11-01 (real review of the 2026-10-19 → 2026-11-01 changes; see the delta section) · 2026-11-07 (mainnet-readiness sweep) · 2026-11-08 (brand mark)
**Reviewer:** Internal review
**Severity ceiling:** Low — a static page of public data, no input, no credentials
**Status:** C8 — the roadmap page implemented; 42 vitest tests; 14 Chromium tests (flows, link-preview tags, phone width, axe in every theme and season); lint, type-check, build, CSP and dist checks green; the runtime image built from this `dist` passes `scripts/smoke.sh`. The full image build waits for nothing unpublished (the site has no unpublished dependency)

---

## Executive summary

A scaffold: the build, test, lint and release pipeline and the structure the next steps fill. The positive findings
record the properties fixed now; the deferred ones name the step that delivers the rest. Nothing is published.

**2026-11-01 update.** The page was rebuilt on the shared shell and its date helpers moved to web-utils. The review found nothing to fix: the two reads are bounded and validated, the page claims no verification it does not perform, and the four states pass the shared sweep on five browsers (F7, F8).

## Threat model / trust boundaries

| Actor | Holds / proves | Can do | Bounded by |
| --- | --- | --- | --- |
| Dependency authors | code in the lockfile | run at build and in the bundle | lockfile, audit gate, licence check |
| CI and the registries | the published artefact | serve it | OIDC publishing, provenance, digest pins |
| The content hub service | the API responses | data shown or used | server-side enforcement; the client mirrors only |

## Severity scale

Critical / High / Medium / Low / Info / Positive (unchanged across the corpus).

## Scope

The repository at 0.0.1 (sources, tests, workflows, Dockerfile, scripts/smoke.sh). Environment: Node 24, npm 11, podman 4.9.3.

## Findings

### F1 — Positive: same-origin, read-only page
**Severity:** Positive
**Where:** `Dockerfile` CSP (`connect-src 'self'`)
**Issue:** —
**Impact:** the page contacts only its own host
**Remediation / evidence:** `scripts/smoke.sh`; `npm run check:csp`

### F2 — Positive: semantic structure (one h1 in main)
**Severity:** Positive
**Where:** `src/App.vue`
**Issue:** —
**Impact:** accessible, predictable for readers and agents
**Remediation / evidence:** `tests/app.test.ts`

### F3 — The roadmap is rendered
**Severity:** Positive (was Info, DEFERRED)   **Disposition:** RESOLVED (2026-10-29, C8)
**Where:** `src/RoadmapView.vue`, `src/components/*`
**Issue:** —
**Impact:** Phases and items show with public wording, status, dates and a filter; loading, error (with retry), empty and timeout states are handled.
**Remediation / evidence:** `tests/app.test.ts`, `e2e/site.spec.ts`.

### F4 — Positive: nothing but the displayed fields can reach the page
**Severity:** Positive
**Where:** `src/lib/roadmap.ts` (`parseRoadmap`, `parseSnapshot`)
**Issue:** —
**Impact:** The parser keeps only the fields the page shows, bounds their lengths, and drops malformed or unknown entries.
Even if a response gained an internal field (or was tampered with), it cannot be displayed. Links must be https and pass `safeHref`.
**Remediation / evidence:** `tests/roadmap.test.ts` (leak test with `SECRET`/`internal_*`/`visible_bot` fields), `tests/app.test.ts`, `e2e/site.spec.ts` (the body text contains none of them).

### F5 — Positive: link previews and accessibility
**Severity:** Positive
**Where:** `vite.config.ts` (meta plugin), `StatusPill`, `StatusFilter`
**Issue:** —
**Impact:** Title, description and Open Graph / Twitter tags are in the static HTML (crawlers and unfurlers do not run script); canonical and `og:url` appear only when an https address is configured. Statuses are words with a symbol; no WCAG 2.2 AA violation in any theme or season; no sideways scroll at 375 px.
**Remediation / evidence:** `scripts/check-dist.mjs`, `e2e/site.spec.ts` (tags, phone width, 8 axe runs).

### F6 — The snapshot note depends on a second route
**Severity:** Info   **Disposition:** ACCEPTED
**Where:** `src/RoadmapView.vue`
**Issue:** The verifiable record needs `/public/v1/snapshot` on the same host, so the ingress for the roadmap host routes that exact path too (ARCHITECTURE.md §3).
**Impact:** If the route is not exposed, or no snapshot exists, the note is simply absent; the roadmap is unaffected.
**Remediation / evidence:** `tests/app.test.ts` ("stays quiet when there is none or it fails").

### Frontend wave delta review (2026-11-01) — 0.0.3 reviewed · 0.0.4 released and deployed 2026-11-05

Scope: the changes since the last substantive entry (2026-10-30, 0.0.2, which fixed the phone filter layout from screenshots): 0.0.3 — the page rebuilt on `UiAppShell` and `@meddleware/ui` components (`StatusFilter` and `StatusPill` deleted; token-only styling), its date formatting moved to `@meddleware/web-utils` (`lib/format.ts` deleted), `lib/roadmap.ts` parsing tightened, and the five-browser sweep. The package is private (the image is the artefact). The release tool's "re-verified" marks for these releases recorded no review; this section is the review. Read: `RoadmapView.vue` (the two API reads), `lib/roadmap.ts` (`parseRoadmap`, `parseRoadmapSnapshot`: what is accepted and refused), `SnapshotNote.vue` (the verification note and its links), `main.ts`, the Dockerfile and CSP, the workflows and the tests; and, live, the two public documents it reads. Ran (with the locally packed `ui` 0.1.38, `design-tokens` 0.1.13, `web-utils` 0.0.2, `frontend-config` 0.0.2): the audit gate (0 not allowlisted; the two `extract-zip` advisories are allowlisted until 2027-01-31), `vue-tsc`, lint (stylelint, eslint, html-validate), `vitest` (4 files, 37 tests (the audit said 42 at 0.0.2: the date-format tests moved to web-utils with the code)), the production build and `check:csp` and `check:dist` (no inline script in the built page; no audit page in the build), `npm pack --dry-run` (not applicable: the package is private and ships as an image), and the browser suite on Chromium, Firefox, WebKit, a Pixel 7 and an iPhone 14 with the CI font (DejaVu Sans through fontconfig): **330 passed in 5.5 minutes**.

### F7 — Positive: the page reads two public documents with a size cap and shows only what validates
**Severity:** Positive
**Where:** `src/RoadmapView.vue`, `src/lib/roadmap.ts`, `src/components/SnapshotNote.vue`
**Evidence:** both reads go through `fetchJson` (web-utils 0.0.2: a timeout, `credentials: 'omit'` and, since this release, a default 1 MiB cap; the live documents are 2.1 KB and 1.1 KB, so the cap leaves about 500× headroom) and are parsed by `parseRoadmap` (`schema_version` 1 and a phase list, else null) and `parseRoadmapSnapshot` (a missing or unrecognised snapshot is "none yet", not an error); a snapshot's blob link is shown only when it is `https` and at most 500 characters and then goes through `safeHref`; the signer's account link goes through `suiExplorerUrl`. The snapshot is **not** verified by the page — it says how to (fetch the blob, compare its SHA-256, verify the personal-message signature, check the signer) — so nothing here claims a verification it did not do. The unit tests answer with real `Response` objects, so the bounded read path is the one under test. The live `/public/v1/snapshot` has the keys the parser expects (`schema`, `snapshot`, `blob_url`, `verify`), compared 2026-11-05.

### F8 — Positive: the shared sweep covers every screen and passes on five browsers with the CI font
**Severity:** Positive
**Where:** e2e/a11y.spec.ts (`defineA11ySuite`, AAA `gate`)
**Evidence:** four states — the roadmap, the verifiable-record section opened, an empty roadmap and a failing API (HTTP 503) — each at AA and AAA (gating) in all ten theme × season looks, at 320 px, 200% text, in forced colours, under reduced motion and by keyboard, on five browser projects: 330 tests passed with the CI font.

### F9 — The signer address shown to visitors has no independent public source

**Severity:** Info   **Disposition:** DEFERRED (FU-0074)
**Where:** `src/components/SnapshotNote.vue` (step 4 of the verification list)
**Issue:** the record tells a visitor to check that the signing address is the signer they expect. The address of the snapshot signer appears only in the private ADR-0007, on `/public/v1/snapshot` and on this page; no public page states it, so a visitor has nothing independent to compare it with. The text used to say the address must be "the one the operator has published", which was not true of anything published today; it now says that an address shown only on this page cannot vouch for itself (compared with `content-hub-service` `docs/SNAPSHOT.md` and ADR-0007 section 6, 2026-11-08).
**Impact:** the signature proves the document was signed by that key, not by Meddleware; the check is only as strong as a second source for the address. Nothing is overstated by the page.
**Remediation / evidence:** a decision on where to publish the address (docs site, the machine host) and a link from step 4 (FU-0074). The address shown is public data and is unchanged.

### Delta notes (A11Y lens, `AUDIT_TEMPLATE_A11Y.md`)
- **Support promise:** the shared browserslist (`@meddleware/frontend-config/browserslist-config`); build target through `viteTarget()`; compat lints on.
- **Accessibility gates:** the shared sweep over four states (axe AA and AAA `gate`; 320 px reflow; 200% text; forced colours; reduced motion; keyboard incl. focus not obscured), Lighthouse CI on the production build, `check:csp` and `check:dist`, five browser projects in CI. Roadmap is light by default (brand choice, D103); the stored choice wins.
- **Known exceptions:** none disabled; the 44 px enhanced target size, link purpose, reading order and screen-reader announcements are reviewed from screenshots (`npm run shots`), not automated.
- **Supply chain:** `.github/audit-gate.mjs` with two dated `extract-zip` allowlist entries (dev-only, via `@lhci/cli`, expiry 2027-01-31, D104; OPERATOR_TASKS.md) and the `basic-ftp`/`tmp`/`zod` overrides; Dependabot (npm, Actions, Docker); `@meddleware/frontend-config` is a dev dependency (its audit F5).

## Section A — Invariant verification matrix

| # | Invariant (plain statement) | Enforced / asserted at (`file:fn`) | Proven by (test / code-assert / cross-project) | Status |
| --- | --- | --- | --- | --- |
| I1 | same-origin, read-only page | `Dockerfile` CSP (`connect-src 'self'`) | `scripts/smoke.sh` | HOLDS |
| I2 | semantic structure (one h1 in main) | `src/App.vue` | `tests/app.test.ts` | HOLDS |
| I3 | only the fields the page shows can reach it; nothing internal | `src/lib/roadmap.ts` | `tests/roadmap.test.ts`; browser leak check | HOLDS |
| I4 | untrusted text renders as text; links only https via `safeHref` | templates, `SnapshotNote.vue` | hostile-text tests (component and browser) | HOLDS |
| I5 | only two same-origin routes are read, without credentials | `RoadmapView.vue` | `tests/app.test.ts` (paths, `credentials: 'omit'`); CSP in the browser tests | HOLDS |
| I6 | statuses are words first; WCAG 2.2 AA in every theme and season; no sideways scroll at phone width | `StatusPill`, `StatusFilter` | `e2e/site.spec.ts` | HOLDS |
| I7 | link-preview tags are static; no test support in `dist` | `vite.config.ts`, `scripts/check-dist.mjs` | CI step | HOLDS |

## Section B — Supply-chain, publish-authority & capability matrix

### B.1 Dependency & CVE risk

| Dependency | Pinned version / rev / object ID | Liveness dependency? | CVE / audit status | Notes |
| --- | --- | --- | --- | --- |
| npm dev and runtime dependencies | `package-lock.json` | build only (runtime: vue, @meddleware/ui, design-tokens) | 0 high/critical (2026-10-25) | |

### B.2 Publish authority, capabilities & secret custody

| Authority / capability / secret | Where minted / held | Custody | Gates | Immutability / rotation plan |
| --- | --- | --- | --- | --- |
| npm publish | CI on `v*` tags | GitHub OIDC (trusted publishing / keyless cosign) | releases | trusted publisher configured at R2 |

Actions pinned by SHA, `permissions: contents: read` by default, release gate = CI (`verify`), Dependabot present —
all hold (copied from the fleet workflows).

## Section C — Test-coverage & hermetic/live split

### C.1 Coverage grade

| Dimension | Assessment |
| --- | --- |
| Happy-path coverage | the page with phases, items, dates, filter and the snapshot note, in a browser |
| Error-path / abort-code / failure-mode coverage | non-OK answers, a response that is not a roadmap, a hung request (timeout), a failing snapshot route, retry |
| Boundary / edge-case coverage | oversize and malformed fields dropped, caps on phases, an empty roadmap, a phase with no items, a filter with no match |
| Security-relevant coverage | internal fields in a response never shown, hostile text, https-only links, CSP violations fail the browser tests |

42 vitest tests; 14 Chromium tests; stylelint, eslint + a11y, html-validate, type-check, build, `check:csp`, `check:dist`,
`check:licenses` green; the runtime image built from this `dist` passes `scripts/smoke.sh` with podman.

### C.2 Hermetic vs. live paths

| Path | Hermetic unit test? | Deferred to (localnet / testnet / running committee / live relay)? | Tracking |
| --- | --- | --- | --- |
| Against the live service | no (mocked routes; the service's tests pin the documents' shapes) | C9 local end-to-end | — |

## Section D — Deployment-readiness gates

### pre-localnet
- [x] builds; lint, type-check and tests green — 2026-10-29 (42 unit, 14 browser)
- [x] accessibility: axe, both themes, four seasons
- [x] no secrets in source

### pre-testnet
- [x] `SECURITY.md` present
- [x] image signed and pinned — 2026-10-30, R2
- [x] deployment prepared: its Deployment (non-root, read-only root, no token, no egress), the deployment's own
  `robots.txt`/`llms.txt` mounted over the generic ones, `roadmap.` routing exactly its two data routes to the public
  process (proved on the rendered manifests) — 2026-10-29, C9
- [x] deployed on `roadmap.`; the page, `/public/v1/roadmap` and `/public/v1/snapshot` answer from the live host; the signed record verifies (hash and `@mysten/sui` signature, from the public aggregator) — 2026-10-30, R2
- [ ] link previews (Discord/Telegram/Bluesky unfurlers) checked on the live host — at the first announcement

### pre-mainnet
- [ ] external review (ADR-0009 gate G4: not a launch gate; covered by redeploy and the audit pass)

## Cross-project themes

- **Supply chain & release integrity** — lockfile committed; actions pinned; audit gate in CI.
- **Wire-format coupling & conformance vectors** — `@meddleware/content-hub-client/vectors.json` (the client is its home;
  the service checks its copy).
- **On-chain-truth boundary** — the server decides; this project previews or displays.
- **Deployment readiness** — Section D.
- **Chain-access layering** — no Move package consumed.

## Normative requirements

- MUST keep the invariants of Section A (each HOLDS with its test).
- MUST NOT hold credentials, render untrusted text as markup, or contact a third-party origin.

## Implementation suggestions

- None beyond the deferred steps.

## Open questions

- **OQ1** Should the page offer a "download the signed document" button? Today it links the Walrus blob; the aggregator's URL
  is operator configuration.
- **OQ2** The Walrus Site copy has no same-origin data route; see [../WALRUS_SITE.md](../WALRUS_SITE.md) (plan, mainnet-gated).

## Risks

- npm supply chain (mitigated by the lockfile and audit gate).

## Re-verification log

- 2026-10-25 — first pass of the C4 scaffold.
- 2026-10-29 — C8: the page (F3 RESOLVED); F4, F5 Positive; F6 recorded; invariants I3–I7. 42 unit and 14 browser tests; runtime image smoke ok.
- 2026-10-29 — C8: the Walrus Site plan written (docs/WALRUS_SITE.md); nothing published; OQ2 recorded.
- 2026-10-29 — C9: deployment prepared in the operator's workspace (route exposure proved on the rendered manifests); the two data routes it reads were exercised against the real public process in the local end-to-end run.
- 2026-10-30 — R2: released (v0.0.1) and deployed; the snapshot record verified end to end on the live host.
- 2026-11-01 — frontend-wave delta review of 0.0.3. Read the two API reads and their parsers, the verification note, the build configuration, the Dockerfile and CSP, the workflows and the tests; ran the gates and the five-browser suite with the CI font (330 passed in 5.5 minutes). Nothing to fix in the page; the unit tests already answered with real `Response` objects, so ui's and web-utils' bounded-read changes needed no test change here. F7–F8 recorded as Positive. The release tool's bare "re-verified" marks were reworded to "released". `**Template:**` dates reconciled to the 2026-11-01 registry (TS/VUE changes add rows; the VUE colour row moved to A11Y, applied in full here) with no disposition change.
- 2026-11-07 — mainnet-readiness sweep (0.0.7). **Wording and audience (D117):** "operator" is gone from everything a visitor or a crawler reads: the verification step "check that the signing address is the one the operator has published" (the verifiable record) is now "Check that the signing address is the signer you expect: an address shown only on this page cannot vouch for itself" (F9, FU-0074: the signer address is published nowhere public except this page and the snapshot route, so the old sentence promised a source that does not exist; the address shown is public data and unchanged); `public/llms.txt` lost the same two phrases; the package description ("phases and items an operator has made public") is "what is planned, in progress and done"; the empty page's "Check back soon." is "Phases and items appear here once they are made public." The jargon is explained where it is used: the lede says phases are stages of the plan and items single pieces of work, the record says what Walrus is, what the signer is and that the SHA-256 is a fingerprint, and the checking steps are an ordered list of four steps (they match `content-hub-service` `docs/SNAPSHOT.md` and ADR-0007 section 6: fetch the blob from an aggregator by its id, compare the SHA-256, verify the personal-message signature with `@mysten/sui`, check the signer). A signed record whose document was never stored on Walrus (the hub records such a row when its publisher is unset) used to be described as "recorded"/"stored"; it now says the document is not on Walrus and cannot be checked yet, and shows no steps. No build variable, script or env name, "coming soon" or "MeddleWare" is in anything a visitor sees (`VITE_SITE_NAME` appears only in a code comment, README, the Dockerfile and `vite.config.ts`; a test and an e2e now fail on those words in the rendered page). **Semantics:** the phase window and the record's two times are `<time datetime>` (the window was plain text); no `<br>`, `<b>`, inline style or click handler on a non-interactive element exists; headings run h1, h2 per phase, h3 per item without skipping (an e2e checks the sequence); the item rows were already a list of articles and the facts a `dl`. **Shell decision:** `App.vue` keeps `UiAppShell` with `AppHeader` and `AppFooter` instead of `AppToolShell`: that component hides its `h1` and puts the tool's name in the header, while this page has a visible `h1` and a lede and takes its name from the deployment (`VITE_SITE_NAME`), and its footer would link a documentation and a developer page for a tool slug that does not exist for the roadmap. **Shared tooling:** `@meddleware/frontend-config` 0.0.7 (`mw-audit-gate`, `mw-third-party-licenses`, `mw-check-csp-inline`, `mw-sync`; the three local scripts and the CSP script's test deleted; `"meddleware": { kind: app, csp: static-strict, lhci: true }` because the allowlist equals the lhci template; the Dockerfile CSP equals the `static-strict` profile), `meddlewareApp` (wallet false, light default kept, dev `/public` proxy and the preview CSP kept, the meta plugin now reads the mode in `configResolved`), `vueTestConfig`, the `vue-app` tsconfig base (`tsconfig.build.json` removed: the build is `vue-tsc --noEmit && vite build`), `@meddleware/ui` 0.1.40, `@meddleware/web-utils` 0.0.4 (the new ampersand handling is in `parseSnapshot`, which this page does not use; roadmap names already kept `&`, now a test), `mw-sync --check` added to CI. Kept: `scripts/smoke.sh` (image probe) and `scripts/check-dist.mjs` (link-preview tags and no test support: app-specific, it has no CSP part). `AGENTS.md` merged into `CLAUDE.md` (layout and commands, each checked against the code) and reduced to the pointer. The bundle is 34.8 kB gzipped (was about 31): README updated. **Port collision:** Playwright and Lighthouse used port 4292, also token-issuance-ui's; a stale `vite preview` of that repo answered the first run with the wrong page, so this repo moved to 4297 (FU-0075 for the other collisions). **New finding F9 (Info, DEFERRED, FU-0074):** the signer address has no independent public source. **Verified:** `vue-tsc` clean; stylelint, eslint and html-validate clean without disabled rules; 3 test files, 36 tests (5 new in `tests/app.test.ts`: plain words and explained terms, the checking steps and `<time>`s, a record without a Walrus blob, a name with an ampersand and the window dates, a one-sided window; the 6 tests of the removed script went with it, its bin is tested in frontend-config); `vite build`, `check:csp`, `check:dist`, `check:licenses` (28 production packages), `mw-audit-gate` (0 not allowlisted; it warns that the two `extract-zip` allowlist entries no longer match an advisory: left for FU-0060, not edited here), `mw-sync --check` ok, Lighthouse CI passed, the image built with podman and `scripts/smoke.sh` passed; five-browser Playwright suite with the CI font, 335 passed in 10.8 minutes (330 before plus the new reading-order test on five browsers). Findings F1–F8 unchanged.
- 2026-11-08 — brand mark and de-enshittification (0.0.8). **Brand and shell:** the hand-written shell (`UiAppShell` + `AppHeader` + `AppFooter`) is replaced by `AppToolShell` (`@meddleware/ui` 0.1.42), which now fits: `title` is the deployment's site name (`VITE_SITE_NAME`, default "Roadmap"), `:page-heading="false"` because the page keeps its own visible `h1` named by the deployment, `:docs-url="false" :dev-url="false"` because a public page has no documentation pages, `default-mode="light"` (the brand default of this site). The header shows the company mark (the Kopimi "K", `BrandMark`) beside the site name; the footer keeps its copyright line, unchanged (it links to the self-hosted PDF at the default `legalBase`; the app serves no copy). The app's own `public/favicon.svg` and the `<link rel="icon">` in `index.html` are deleted; `meddlewareApp({ name })` (`@meddleware/frontend-config` 0.0.8; `name` is the deployment's site name via `loadEnv`, so the web manifest carries it) emits `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `site.webmanifest` and injects the links. The `og:*`, `twitter:card`, description and canonical tags of the repo's own meta plugin are unchanged. **De-enshittification:** grepped the repo (`src`, `index.html`, `public`, `README.md`, the Dockerfile, the workflows) for `fonts.googleapis`, `fonts.gstatic`, `@fontsource`, cdn, unpkg, jsdelivr, cdnjs, gravatar, analytics, gtag and plausible: nothing real. The page reads only its own host's `/public/v1/*` routes; the built bundle names no font file or host. `DO_NOT_TRACK: "1"` is in the `env:` of both workflows. `@meddleware/web-utils` ^0.0.4. **Verified:** `vue-tsc` clean; stylelint, eslint and html-validate clean; 4 test files, 44 tests (new: the mark in the header with no docs or developer link, no icon of the app's own, and `tests/dist.test.ts` over the built `dist/`, `REQUIRE_DIST=1` in CI: the icon set and the manifest name, one icon link per page, no font file or font host, no third-party load, no origin beyond this site, the explorer and legal links and library namespaces); `scripts/check-dist.mjs` also asserts the icon set, one svg icon link and the manifest link (it asserted no favicon before); build emits the icon set; `check:csp`, `check:licenses` (27 production packages), `mw-audit-gate` (0 high/critical) and `npx mw-sync --check` pass; Lighthouse CI passes; the five-browser Playwright suite with the CI font: 335 passed. No finding changed status.
