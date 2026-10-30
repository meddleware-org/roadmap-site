# Publishing the roadmap site as a Walrus Site (plan)

**Status: a plan; nothing is published.** Walrus Sites on `wal.app` are mainnet-only and need a SuiNS name, so this waits
for the mainnet gate (the operator's ADR-0006 §2, ADR-0007 §7). The site is still built so that the step is mechanical.
Facts below were read from docs.wal.app on 2026-10-29 and are marked *(verify)* where a page was thin.

## The idea

The same `dist/` that the static-server image serves is also uploaded as a Walrus Site. A parity check proves the two
copies are the same files. The static-server origin stays the primary (fast, available now); the Walrus Site is the copy a
visitor can verify without trusting our servers.

## The artefact

- Reproducible build: pinned Node (see `.nvmrc`/Dockerfile), `npm ci`, build arguments recorded. The artefact's identity is
  the SHA-256 of a sorted manifest of `dist/` (path + file hash), printed by CI and attached to the release.
- Upload the **built directory**, not the repository root (the docs warn that the root drags in sources and
  `node_modules`).

## `ws-resources.json` (kept in the deployment repository, not here, because it carries the site `object_id`)

```json
{
  "routes": { "/*": "/index.html" },
  "headers": {
    "/index.html": {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "max-age=300",
      "content-security-policy": "<the production CSP from the Dockerfile, verbatim>"
    }
  },
  "metadata": { "site_name": "<operator's site name>" }
}
```

- `routes`: wildcards only at the end of a pattern; the catch-all `/*` maps to `/index.html` (the SPA has one entry).
  Every route target must exist in the site object or the transaction aborts.
- `headers`: **per exact path**, snake_case file keys. There is no global header, so the CSP goes on `/index.html` (the only
  document). Hashed assets under `/assets/` get a long `cache-control` entry each (generated from the build manifest).
  Mirror the static-server's security headers only as far as the portal lets a header be set *(verify which headers the
  portal accepts and which it overrides)*.
- `object_id` is written back on the first publish; keep the file, or the next deploy creates a second site.

## Deploy (when mainnet is allowed)

`site-builder deploy <dist> --epochs <n> --ws-resources <file>` with a `sites-config.yaml` for mainnet. `--epochs` is
required; mainnet epochs are 14 days (so renewals are a recurring task, owned by the hot-wallet model of ADR-0007 §7,
which needs its own explicit float decision). The wallet that owns the site object is the one that can update it: that is
a custody question for the entity multisig, not the hub's hot wallet *(OQ)*.

## Parity verifier

A small tool (Rust or test tooling, never a service): list the site object's resources, fetch each from an aggregator,
and compare path, bytes and the declared headers with `dist/` and the generated `ws-resources.json`. It runs in CI against
a testnet site and after every mainnet deploy; a difference fails the release.

## Open questions

1. **The data route.** The page reads `GET /public/v1/roadmap` on its own host (`connect-src 'self'`). A Walrus Site serves
   static resources only, so that route does not exist there. Options: (a) the Walrus copy reads the latest signed snapshot
   from a published aggregator URL (needs a second `connect-src` entry and a way to learn the current blob id); (b) the
   export job also updates one small resource (`/snapshot.json`) in the site object, which the page reads same-origin
   (needs a site update per snapshot and the owner's signature); (c) a build variant that embeds a snapshot (breaks "the
   identical artefact"). Recommendation: (b) once the site object's owner is settled; until then the Walrus copy is
   static and says so.
2. Which response headers the portal honours on `/index.html`, and whether a CSP set there is enforced.
3. Whether to also publish the `llms.txt`/`robots.txt` resources (the portal serves them like any resource).
4. Who pays renewals and from which wallet (ADR-0007 §7).
