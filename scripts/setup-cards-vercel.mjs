import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { importCardCodes } from '../functions/card-import.mjs'

const projectId = 'tokka-foods', origin = 'https://nfcfoodtest.vercel.app'
const rootRequire = createRequire(import.meta.url), functionRequire = createRequire(new URL('../functions/package.json', import.meta.url))
const auth = rootRequire('../node_modules/firebase-tools/lib/auth.js')
const firebaseApi = rootRequire('../node_modules/firebase-tools/lib/api.js')
const { Firestore } = functionRequire('@google-cloud/firestore')
const account = auth.getGlobalDefaultAccount()
if (!account?.tokens.refresh_token) throw new Error('Conecte a conta autorizada usando firebase login.')
const credentials = { type: 'authorized_user', client_id: firebaseApi.clientId(), client_secret: firebaseApi.clientSecret(), refresh_token: account.tokens.refresh_token }
const db = new Firestore({ projectId, credentials })
const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'])
async function api(url, method = 'GET', body, missing = false) {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const result = await response.json()
  if (missing && response.status === 404) return null
  if (!response.ok) throw new Error(`${new URL(url).hostname}: ${response.status} ${result.error?.message || 'Operação recusada.'}`)
  return result
}
const directory = resolve('.cards-private'), file = resolve(directory, 'tokka-foods-vercel.json')
mkdirSync(directory, { recursive: true, mode: 0o700 })
if (process.platform === 'win32') execFileSync('icacls.exe', [directory, '/inheritance:r', '/grant:r', `${process.env.USERDOMAIN}\\${process.env.USERNAME}:(OI)(CI)F`], { stdio: 'ignore', windowsHide: true })
let config = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
const save = () => writeFileSync(file, JSON.stringify(config), { mode: 0o600 })
try {
  if (!config) {
    if (!(await db.collection('cardsInventory').limit(1).get()).empty) throw new Error('Existem cartões. Restaure a chave original antes de continuar.')
    config = { projectId, origin, exportKey: randomBytes(32).toString('base64') }
    save()
  }
  if (config.projectId !== projectId || config.origin !== origin || Buffer.from(config.exportKey, 'base64').length !== 32) throw new Error('Configuração privada incompatível.')
  const email = `tokka-cards-api@${projectId}.iam.gserviceaccount.com`
  const serviceUrl = `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${email}`
  let serviceAccount = await api(serviceUrl, 'GET', null, true)
  if (!serviceAccount) serviceAccount = await api(`https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts`, 'POST', { accountId: 'tokka-cards-api', serviceAccount: { displayName: 'TOKKA cards Vercel API' } })
  const policyUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`
  const policy = await api(`${policyUrl}:getIamPolicy`, 'POST', { options: { requestedPolicyVersion: 3 } })
  policy.bindings ||= []
  let changed = false
  for (const role of ['roles/datastore.user', 'roles/firebaseauth.viewer']) {
    let binding = policy.bindings.find(binding => binding.role === role && !binding.condition)
    if (!binding) { binding = { role, members: [] }; policy.bindings.push(binding) }
    const member = `serviceAccount:${email}`
    if (!binding.members.includes(member)) { binding.members.push(member); changed = true }
  }
  if (changed) await api(`${policyUrl}:setIamPolicy`, 'POST', { policy })
  if (!config.serviceAccount) {
    const key = await api(`${serviceUrl}/keys`, 'POST', { privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE', keyAlgorithm: 'KEY_ALG_RSA_2048' })
    config.serviceAccount = JSON.parse(Buffer.from(key.privateKeyData, 'base64').toString('utf8'))
    save()
  }
  if (config.serviceAccount.project_id !== projectId || config.serviceAccount.client_email !== email) throw new Error('Credencial de servidor incompatível.')
  const authUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`
  const settings = await api(authUrl)
  const hostname = new URL(origin).hostname
  if (!settings.authorizedDomains.includes(hostname)) await api(`${authUrl}?updateMask=authorizedDomains`, 'PATCH', { authorizedDomains: [...settings.authorizedDomains, hostname] })
  const codes = readFileSync('.cards-test/requested-codes-2026-10-19.txt', 'utf8').trim().split(/\r?\n/)
  const result = await importCardCodes(db, { codes, encryptionKey: Buffer.from(config.exportKey, 'base64'), origin, userId: `operator:${account.user.email}` })
  config.batchId = result.batchId
  save()
  const cards = await db.collection('cardsInventory').where('batchId', '==', result.batchId).get()
  if (cards.size !== codes.length) throw new Error('Quantidade de cartões incompatível.')
  console.log(JSON.stringify({ projectId, ...result, verified: cards.size, serverCredentialReady: true, domainAuthorized: hostname, privateFile: '.cards-private/tokka-foods-vercel.json' }))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally { await db.terminate() }
