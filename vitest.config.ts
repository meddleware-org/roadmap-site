import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Component tests. The Vue plugin compiles SFCs for @vue/test-utils; jsdom is the DOM they mount into.
export default defineConfig({
  plugins: [vue()],
  // Keep @vue/test-utils and the compiled SFCs on a single Vue runtime.
  resolve: { dedupe: ['vue', '@vue/test-utils'] },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
})
