# Security Policy

## Scope

The `roadmap-site` source and image. Out of scope: the content hub service (its own policy), the edge and the
cluster.

## Security model

1. A static, read-only page: it reads two same-origin JSON routes (`connect-src 'self'`), sends no credentials
   (`credentials: 'omit'`), holds none and accepts no input.
2. The data it shows is public by construction: the hub's public process can read only views of public wording.
3. Titles and descriptions are rendered as text, never as markup. The response parser keeps only the fields the page
   shows and bounds their size, so an unexpected or tampered field cannot reach the page; links (the Walrus blob) pass
   `safeHref` and must be https.
4. The image is static-server, nonroot, read-only; the CSP forbids inline scripts.

## Supported versions

The latest release. Pre-0.2 versions receive fixes only in the next release.

## Reporting a vulnerability

Please **do not** open a public issue. Email **<security@meddleware.co.uk>** with a description, reproduction
steps, and the version or commit. Acknowledgement within **3 business days**; a plan within **14 days** for confirmed
issues.

## Disclosure

Coordinated: a fix is released first, then described in the CHANGELOG and the audit
(`docs/audit/roadmap-site-audit.md`).
