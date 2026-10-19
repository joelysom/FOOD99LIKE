import { resolve, join } from 'node:path'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
for (const dir of ['.cards-test', '.cards-test/config', '.cards-test/emulators', '.cards-test/tmp']) mkdirSync(dir, { recursive: true })
const config = {
  functions: [{ source: 'functions', codebase: 'tokka-cards' }],
  firestore: { rules: 'firestore.rules' },
  storage: { rules: 'storage.rules' },
  emulators: { auth: { port: 19099 }, firestore: { port: 18080 }, storage: { port: 19199 }, functions: { port: 15001 }, ui: { enabled: false }, singleProjectMode: true },
}
writeFileSync('.firebase-cards-test.json', JSON.stringify(config))
const temporary = ['functions/.secret.local', 'functions/.env.local']
const backups = temporary.map(path => existsSync(path) ? readFileSync(path) : null)
writeFileSync(temporary[0], `CARDS_EXPORT_KEY=${randomBytes(32).toString('base64')}\n`)
writeFileSync(temporary[1], 'CARDS_PUBLIC_ORIGIN=https://cards.example.test\n')
const browser = process.argv.includes('--browser')
const command = browser ? 'node node_modules/@playwright/test/cli.js test --config tests/cards.playwright.config.mjs' : 'node --test --test-concurrency=1 tests/cards.integration.test.mjs'
const childEnv = { ...process.env, CI: 'true', FUNCTIONS_DISCOVERY_TIMEOUT: '120', XDG_CONFIG_HOME: resolve('.cards-test/config'), FIREBASE_EMULATORS_PATH: resolve('.cards-test/emulators'), TEMP: resolve('.cards-test/tmp'), TMP: resolve('.cards-test/tmp') }
delete childEnv.DEBUG
// Reuse an installed Chromium when available; otherwise Playwright uses its managed browser.
if (!childEnv.PLAYWRIGHT_CHROMIUM_EXECUTABLE && process.platform === 'win32' && process.env.LOCALAPPDATA) {
  const directory = join(process.env.LOCALAPPDATA, 'ms-playwright')
  if (existsSync(directory)) {
    const versions = readdirSync(directory).filter(name => /^chromium-\d+$/.test(name)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    childEnv.PLAYWRIGHT_CHROMIUM_EXECUTABLE = versions.flatMap(name => [join(directory, name, 'chrome-win64', 'chrome.exe'), join(directory, name, 'chrome-win', 'chrome.exe')]).find(existsSync) || ''
  }
}
const child = spawn(process.execPath, [ 'node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:exec', '--project', 'demo-tokka-cards', '--config', '.firebase-cards-test.json', '--only', 'auth,firestore,storage,functions', command], { stdio: 'inherit', env: childEnv })
let restored = false
function restore() {
  if (restored) return
  restored = true
  temporary.forEach((path, i) => backups[i] ? writeFileSync(path, backups[i]) : rmSync(path, { force: true }))
  rmSync('.firebase-cards-test.json', { force: true })
}
process.once('exit', restore)
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { child.kill(signal); restore(); process.exitCode = 130 })
child.on('error', error => { console.error(error.message); restore(); process.exitCode = 1 })
child.on('exit', code => { restore(); process.exitCode = code ?? 1 })
