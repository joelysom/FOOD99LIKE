import { createLocalCardsServer } from '../functions/local-http-server.mjs'
import { readFileSync } from 'node:fs'
import handler from '../server/cards-entry.js'

if (process.argv.includes('--emulators')) {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Os emuladores são obrigatórios neste modo.')
  process.env.CARDS_HTTP_EMULATORS = 'true'
  process.env.CARDS_EXPORT_KEY = readFileSync('functions/.secret.local', 'utf8').match(/^CARDS_EXPORT_KEY=(.+)$/m)[1]
  process.env.CARDS_PUBLIC_ORIGIN = 'https://cards.example.test'
} else {
  const config = JSON.parse(readFileSync('.cards-private/tokka-foods-vercel.json', 'utf8'))
  process.env.CARDS_FIREBASE_SERVICE_ACCOUNT = JSON.stringify(config.serviceAccount)
  process.env.CARDS_EXPORT_KEY = config.exportKey
  process.env.CARDS_PUBLIC_ORIGIN = config.origin
}
const server = createLocalCardsServer(handler)
server.listen(15002, '127.0.0.1', () => console.log('Cards API: http://127.0.0.1:15002'))
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => server.close(() => process.exit(0)))
