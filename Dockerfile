# ── Build stage ───────────────────────────────────────────────────────────────
# Content-Security-Policy served by static-server. The site is same-origin only: it loads its own bundle and
# reads GET /public/v1/roadmap on its own host (the ingress routes that one path to the hub's public process),
# so connect-src is 'self'. style-src keeps
# 'unsafe-inline' for the inline <style> Vite/Vue emit; there are no inline scripts (scripts/check-csp-inline.mjs
# fails the build if one appears).
ARG CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; upgrade-insecure-requests"

# The build stage runs on the BUILD host's architecture: its output (static files) is architecture-independent,
# so no arm64 step runs under emulation. The final stage only COPYs into the multi-arch static-server image.
FROM --platform=$BUILDPLATFORM node:26-slim@sha256:0d1e33586362bb9e608c4e751e7a9e7edb55c9ac11461ed5666af696cc461dd4 AS build

WORKDIR /app

# Install deps first so this layer is cached on code-only changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The site's name in the header and title (an operator's own name for its roadmap).
ARG VITE_SITE_NAME=""
# One sentence for search results and link previews, and the site's public https address (optional: it adds the
# canonical link and og:url). Link previews read the static HTML, so these are fixed at build time.
ARG VITE_SITE_DESCRIPTION=""
ARG VITE_SITE_URL=""
ENV VITE_SITE_NAME=${VITE_SITE_NAME} \
    VITE_SITE_DESCRIPTION=${VITE_SITE_DESCRIPTION} \
    VITE_SITE_URL=${VITE_SITE_URL}

RUN npm run build && npm run licenses && npm run check:dist
ARG CSP
# The CSP has no 'unsafe-inline' for scripts: the build fails if dist/ ever carries an inline <script>.
RUN node scripts/check-csp-inline.mjs "${CSP}" dist

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM quay.io/meddleware-org/static-server:0.1.11@sha256:94685b948d5086ccdb5b0b5d3b7caef6f2e3d1e4b9f7f8a311e9f26950da3723
ARG CSP
ENV CONTENT_SECURITY_POLICY="${CSP}"

COPY --from=build /app/dist /app/public
# The lockfile lets SBOM scanners see the npm packages the bundle was built from (the bundle itself carries no
# package metadata). It sits outside the served directory; THIRD_PARTY_LICENSES is served with the site.
COPY --from=build /app/package-lock.json /usr/share/doc/roadmap-site/package-lock.json

ENV SERVE_DIR=/app/public \
    SPA_FALLBACK=true \
    CACHE_IMMUTABLE_PREFIX=/assets/

USER 65534:65534

EXPOSE 8080
