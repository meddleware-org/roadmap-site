import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { vueTestConfig } from '@meddleware/frontend-config/vitest'

// Component tests (tests/): the Vue plugin compiles SFCs for @vue/test-utils, jsdom is the DOM they mount into. The real-browser
// gate lives in e2e/ and runs under Playwright (npm run test:e2e).
export default defineConfig(vueTestConfig({ plugins: [vue()] }))
