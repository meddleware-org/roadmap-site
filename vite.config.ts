// Vite configuration: the fleet's shared application settings with the Vue plugin, a plugin that fills the page's title and link-preview tags from build variables, the dev proxy to a local
// hub and the production Content-Security-Policy for `vite preview`. `npm run dev` and `npm run build` read it.
// Reads the Dockerfile to take its Content-Security-Policy.
import { readFileSync } from 'node:fs'
// Vite's configuration helper, the build-variable loader and the plugin type.
import { defineConfig, loadEnv, type Plugin } from 'vite'
// The Vue single-file-component plugin.
import vue from '@vitejs/plugin-vue'
// The fleet's shared application settings.
import { meddlewareApp } from '@meddleware/frontend-config/vite'

// The Content-Security-Policy the production image sends (Dockerfile `ARG CSP`). `vite preview` sends the same one, so
// the browser tests run under the real policy and a violation fails them (`upgrade-insecure-requests` is left out only
/** The Content-Security-Policy the production image sends (Dockerfile `ARG CSP`). `vite preview` sends the same one, so the browser tests run under the real policy and a violation fails them (`upgrade-insecure-requests` is left out only because the preview server speaks plain http on localhost). */
function imageCsp(): string | undefined {
  try {
    const m = /^ARG CSP="([^"]+)"/m.exec(readFileSync(new URL('./Dockerfile', import.meta.url), 'utf8'))
    return m?.[1]?.replace(/;\s*upgrade-insecure-requests/, '')
  } catch {
    return undefined
  }
}
// The policy, or undefined where the Dockerfile cannot be read.
const csp = imageCsp()

// The deployment's name (VITE_SITE_NAME) falls back to this. It is the page title, the header and the web manifest's name.
// The name used when the deployment gives none.
const DEFAULT_NAME = 'Roadmap'
// The deployment's name, from the build variable.
const siteName = (mode: string) => loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_NAME || DEFAULT_NAME

// Escape a value for use in an HTML attribute.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// The page's title, description, Open Graph and Twitter tags come from build arguments (no deployment-specific data in the
// repository). Link previews read the static HTML, so these are fixed at build time; the canonical link and `og:url`
/** A plugin that replaces `<!-- @meta -->` in index.html with the page's title, description, Open Graph and Twitter tags. They come from build arguments (no deployment-specific data in the repository); link previews read the static HTML, so they are fixed at build time. */
function meta(): Plugin {
  // The build mode, read once the configuration is resolved.
  let mode = 'production'
  return {
    // The plugin's name, for build logs.
    name: 'roadmap-meta',
    // Remember the mode.
    configResolved(config) {
      mode = config.mode
    },
    // Fill in the placeholder in index.html.
    transformIndexHtml(html) {
      // The build variables.
      const env = loadEnv(mode, process.cwd(), 'VITE_')
      const name = siteName(mode)
      // The description, or the default sentence.
      const description = env.VITE_SITE_DESCRIPTION || 'Public roadmap: what is planned, in progress and done.'
      // The canonical address, only if it is a plain https address.
      const url = /^https:\/\/[^\s"<>]+$/.test(env.VITE_SITE_URL ?? '') ? env.VITE_SITE_URL!.replace(/\/$/, '') + '/' : ''
      // The tags: title, description, Open Graph, Twitter card and (when there is an address) the canonical link.
      const tags = [
        ['title', `<title>${esc(name)}</title>`],
        ['description', `<meta name="description" content="${esc(description)}" />`],
        ['og:type', '<meta property="og:type" content="website" />'],
        ['og:site_name', `<meta property="og:site_name" content="${esc(name)}" />`],
        ['og:title', `<meta property="og:title" content="${esc(name)}" />`],
        ['og:description', `<meta property="og:description" content="${esc(description)}" />`],
        ['twitter:card', '<meta name="twitter:card" content="summary" />'],
        ...(url ? [['canonical', `<link rel="canonical" href="${esc(url)}" />`], ['og:url', `<meta property="og:url" content="${esc(url)}" />`]] : []),
      ]
      // Replace the placeholder with the tags.
      return html.replace('<!-- @meta -->', tags.map(([, t]) => t).join('\n    '))
    },
  }
}

// In production the ingress routes /public/v1/roadmap and /public/v1/snapshot on this host to the hub's public process
// (same origin, no CORS); in development they are proxied to a local `content-hub public`. The site has no wallet. Light is
// its brand default (a saved choice wins).
// The fleet's settings with the Vue plugin and the meta plugin.
export default defineConfig((env) =>
  meddlewareApp({
    plugins: [vue(), meta()],
    // The web manifest carries the deployment's name, like the title and the header.
    // The web manifest carries the deployment's name, like the title and the header.
    name: siteName(env.mode),
    theme: 'light',
    wallet: false,
    // Site-specific settings: the dev proxy and the preview policy.
    config: {
      server: { proxy: { '/public': { target: 'http://localhost:8080', changeOrigin: true } } },
      preview: { headers: csp ? { 'Content-Security-Policy': csp } : {} },
    },
  })(env),
)
