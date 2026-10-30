/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The site's name in the header, the title and link previews (default "Roadmap"). */
  readonly VITE_SITE_NAME?: string
  /** One sentence for search results and link previews. */
  readonly VITE_SITE_DESCRIPTION?: string
  /** The site's public address (https), for the canonical link, `og:url` and the sitemap line. Optional. */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
