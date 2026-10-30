import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// The Content-Security-Policy the production image sends (Dockerfile `ARG CSP`). `vite preview` sends the same one, so
// the browser tests run under the real policy and a violation fails them (`upgrade-insecure-requests` is left out only
// because the preview server speaks plain http on localhost).
function imageCsp(): string | undefined {
  try {
    const m = /^ARG CSP="([^"]+)"/m.exec(readFileSync(new URL('./Dockerfile', import.meta.url), 'utf8'))
    return m?.[1]?.replace(/;\s*upgrade-insecure-requests/, '')
  } catch {
    return undefined
  }
}
const csp = imageCsp()

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// The page's title, description, Open Graph and Twitter tags come from build arguments (no operator data in the
// repository). Link previews read the static HTML, so these are fixed at build time; the canonical link and `og:url`
// appear only when VITE_SITE_URL (an https address) is given.
function meta(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const name = env.VITE_SITE_NAME || 'Roadmap'
  const description = env.VITE_SITE_DESCRIPTION || 'Public roadmap: what is planned, in progress and done.'
  const url = /^https:\/\/[^\s"<>]+$/.test(env.VITE_SITE_URL ?? '') ? env.VITE_SITE_URL!.replace(/\/$/, '') + '/' : ''
  return {
    name: 'roadmap-meta',
    transformIndexHtml(html) {
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
      return html.replace('<!-- @meta -->', tags.map(([, t]) => t).join('\n    '))
    },
  }
}

// In production the ingress routes /public/v1/roadmap and /public/v1/snapshot on this host to the hub's public process
// (same origin, no CORS); in development they are proxied to a local `content-hub public`.
export default defineConfig(({ mode }) => ({
  plugins: [vue(), meta(mode)],
  server: {
    proxy: {
      '/public': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  preview: { headers: csp ? { 'Content-Security-Policy': csp } : {} },
}))
