// The entry of index.html: the stylesheets and the seasonal theme, then the page. Related: src/App.vue.
// The design tokens: every colour, space and type size the components use.
import '@meddleware/design-tokens/tokens.css'
// The seasonal accent colours.
import '@meddleware/design-tokens/seasons.css'
// The shared reset and base styles.
import '@meddleware/ui/reset.css'
// Vue's application factory.
import { createApp } from 'vue'
// Applies the seasonal accent colours.
import { useSeason } from '@meddleware/ui'
// The page.
import App from './App.vue'

// Apply the seasonal accent colours.
useSeason()
// Mount the application.
createApp(App).mount('#app')
