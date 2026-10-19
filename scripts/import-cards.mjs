import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { parseArgs } from 'node:util'
import { importCardCodes } from '../functions/card-import.mjs'

const { values } = parseArgs({ options: {
  file: { type: 'string' }, project: { type: 'string', default: 'tokka-foods' },
  origin: { type: 'string' }, 'request-id': { type: 'string' },
  'firebase-account': { type: 'string' },
  'key-file': { type: 'string' },
} })
if (!values.file || !values.origin) throw new Error('Uso: npm run firebase:import-cards -- --file ARQUIVO_PRIVADO --origin https://DOMINIO_ATUAL [--firebase-account EMAIL]. Requer permissão administrativa no projeto.')
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Remova as variáveis de emulador antes da importação de produção.')
const codes = (await readFile(values.file, 'utf8')).split(/\r?\n/).map(line => line.trim()).filter(Boolean)
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const { GoogleAuth } = require('google-auth-library')
const { Firestore } = require('@google-cloud/firestore')
let credentials, operator
if (values['firebase-account']) {
  const rootRequire = createRequire(import.meta.url)
  const auth = rootRequire('../node_modules/firebase-tools/lib/auth.js')
  const api = rootRequire('../node_modules/firebase-tools/lib/api.js')
  const account = auth.getAllAccounts().find(account => account.user.email === values['firebase-account'])
  if (!account?.tokens.refresh_token) throw new Error('Conta não conectada à CLI. Execute firebase login:add com a conta autorizada.')
  credentials = { type: 'authorized_user', client_id: api.clientId(), client_secret: api.clientSecret(), refresh_token: account.tokens.refresh_token }
  operator = `operator:${account.user.email}`
}
const google = new GoogleAuth({ projectId: values.project, scopes: ['https://www.googleapis.com/auth/cloud-platform'], ...(credentials ? { credentials } : {}) })
const db = new Firestore({ projectId: values.project, ...(credentials ? { credentials } : {}) })
try {
  // Check project access before attempting to retrieve the encryption secret.
  await db.collection('cardsBatches').limit(1).get()
  const client = await google.getClient()
  const secret = values['key-file'] ? JSON.parse(await readFile(values['key-file'], 'utf8')).exportKey : Buffer.from((await client.request({ url: `https://secretmanager.googleapis.com/v1/projects/${encodeURIComponent(values.project)}/secrets/CARDS_EXPORT_KEY/versions/latest:access` })).data.payload.data, 'base64').toString('utf8').trim()
  const encryptionKey = Buffer.from(secret, 'base64')
  const identity = await google.getCredentials()
  const result = await importCardCodes(db, { codes, encryptionKey, origin: values.origin, userId: operator || identity.client_email || 'operator:application-default', requestId: values['request-id'] })
  encryptionKey.fill(0)
  const records = await db.collection('cardsInventory').where('batchId', '==', result.batchId).get()
  if (records.size !== codes.length) throw new Error('A conferência da quantidade cadastrada falhou.')
  console.log(JSON.stringify({ projectId: values.project, ...result, verified: records.size }))
} catch (error) {
  // Do not print credential objects, input codes or Secret Manager response bodies.
  console.error(`Importação não concluída no projeto ${values.project}: ${error.code || 'erro'}. ${error.code === 7 || error.code === 403 ? 'A conta precisa de acesso administrativo ao Firestore e ao segredo CARDS_EXPORT_KEY.' : 'Confira autenticação, configuração e a lista privada de códigos.'}`)
  process.exitCode = 1
} finally { await db.terminate() }
