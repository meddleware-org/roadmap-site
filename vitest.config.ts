// Vitest configuration for the component tests (`npm test`).
// The Vue plugin.
import vue from '@vitejs/plugin-vue'
// Vitest's typed configuration helper.
import { defineConfig } from 'vitest/config'
// The fleet's shared test settings.
import { vueTestConfig } from '@meddleware/frontend-config/vitest'

// Component tests (tests/): the Vue plugin compiles SFCs for @vue/test-utils, jsdom is the DOM they mount into. The real-browser
// gate lives in e2e/ and runs under Playwright (npm run test:e2e).
// The shared settings with the Vue plugin.
export default defineConfig(vueTestConfig({ plugins: [vue()] }))
