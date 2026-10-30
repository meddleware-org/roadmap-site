# Security Audit — `roadmap-site`

**Classification:** Internal security review
**Project:** repos/roadmap-site (the public roadmap page of a content hub)
**Project type:** Vue app (static site)
**Template:**

- AUDIT_TEMPLATE.md (2026-10-08)
- AUDIT_TEMPLATE_TS.md (2026-10-08)
- AUDIT_TEMPLATE_VUE.md (2026-10-08)
- AUDIT_TEMPLATE_IMG.md (2026-10-08)

**Package manager / lockfile:** npm 11, package-lock.json committed
**Module format:** ESM
**Publish model:** not published to npm (image only)
**Runtime targets:** browser
**Peer dependencies:** none
**Build tool:** vite 8, @vitejs/plugin-vue 6, vue 3.5
**Hosting:** static-server 0.1.11 image
**Embedding hosts:** none
**VITE_* inventory:** VITE_SITE_NAME, VITE_SITE_DESCRIPTION, VITE_SITE_URL
**Images:** quay.io/meddleware-org/roadmap-site (unpublished)
**Base images:** node:26-slim@sha256:0d1e3358… (build, $BUILDPLATFORM) · static-server:0.1.11@sha256:94685b94… (runtime)
**Runtime user:** 65534   **Runtime FS:** read-only
**Deployed by:** the instance's `post-bootstrap/content-hub/` (C9)
**Build args:** VITE_SITE_NAME, VITE_SITE_DESCRIPTION, VITE_SITE_URL — not secret
**Deployment status:** unpublished (0.0.1 local, Series C C4)
**Review date:** 2026-10-29
**Reviewer:** Internal review
**Severity ceiling:** Low — a static page of public data, no input, no credentials
**Status:** C8 — the roadmap page implemented; 42 vitest tests; 14 Chromium tests (flows, link-preview tags, phone width, axe in every theme and season); lint, type-check, build, CSP and dist checks green; the runtime image built from this `dist` passes `scripts/smoke.sh`. The full image build waits for nothing unpublished (the site has no unpublished dependency)

---

## Executive summary

A scaffold: the build, test, lint and release pipeline and the structure the next steps fill. The positive findings
record the properties fixed now; the deferred ones name the step that delivers the rest. Nothing is published.

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
- [ ] published with provenance — R2
- [x] deployment prepared: its Deployment (non-root, read-only root, no token, no egress), the deployment's own
  `robots.txt`/`llms.txt` mounted over the generic ones, `roadmap.` routing exactly its two data routes to the public
  process (proved on the rendered manifests) — 2026-10-29, C9
- [ ] deployed; link previews and the snapshot record checked on the live host — R2

### pre-mainnet
- [ ] external review

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
