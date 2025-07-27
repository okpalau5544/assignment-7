import { defineConfig } from 'vitest/config'
import vitestOpenapiPlugin from './vitest-openapi-plugin'

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts}'],
    setupFiles: ['./database_test_setup.ts'],
    globalSetup: ['./global_database_install.ts'],
    testTimeout: 30000,
    hookTimeout: 30000
  },
  plugins: [
    vitestOpenapiPlugin
  ]
})
