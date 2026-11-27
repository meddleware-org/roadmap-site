// Type declarations for the build variables. Vite's client types give `import.meta.env`; this file narrows it to the variables the site reads
// (see .env.example). Related: src/App.vue reads the name; vite.config.ts reads all three at build time.
// Vite's client types: `import.meta.env`, asset imports and the like.
/// <reference types="vite/client" />

/** The build variables this site reads; every one is optional and none is a secret. */
interface ImportMetaEnv {
  /** The site's name in the header, the title and link previews (default "Roadmap"). */
  readonly VITE_SITE_NAME?: string
  /** One sentence for search results and link previews. */
  readonly VITE_SITE_DESCRIPTION?: string
  /** The site's public address (https), for the canonical link, `og:url` and the sitemap line. Optional. */
  readonly VITE_SITE_URL?: string
}

/** Types `import.meta.env` with the variables above. */
interface ImportMeta {
  readonly env: ImportMetaEnv
}
