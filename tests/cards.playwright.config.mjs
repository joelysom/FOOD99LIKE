import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: '.', testMatch: 'cards.browser.spec.mjs', workers: 1, timeout: 120000,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}, screenshot: 'only-on-failure' },
  webServer: { cwd: fileURLToPath(new URL('../', import.meta.url)), command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174/cartoes', reuseExistingServer: false, timeout: 180000, env: { VITE_CARDS_EMULATORS: 'true', VITE_FIREBASE_ENABLED: 'false', VITE_CARDS_AUTH_PORT: '19099', VITE_CARDS_FUNCTIONS_PORT: '15001', VITE_CARDS_STORAGE_PORT: '19199' } },
})
