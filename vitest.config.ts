import { defineConfig } from 'vitest/config'
import vitestOpenapiPlugin from './vitest-openapi-plugin'

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts}'],
    setupFiles: ['./database_test_setup.ts'],
    globalSetup: ['./global_database_install.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    env: {
      NODE_ENV: 'test'
    }
  },
  plugins: [
    vitestOpenapiPlugin
  ]
})
