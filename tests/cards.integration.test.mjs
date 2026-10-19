import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test, { before, after } from 'node:test'
import { initializeApp, deleteApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js'
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getBytes } from 'firebase/storage'
const projectId = 'demo-tokka-cards'
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Execute npm run test:cards:integration; testes nunca acessam produção.')
const app = initializeApp({ projectId }), db = getFirestore(app)
let rules, batchId, cards, alice, bob, admin, carol
async function account(name) {
  const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${name}-${randomUUID()}@test.local`, password: 'Secret123!', returnSecureToken: true }) })
  const data = await response.json()
  assert.ok(response.ok, JSON.stringify(data))
  return { uid: data.localId, token: data.idToken }
}
async function call(action, payload = {}, user = null) {
  const response = await fetch(`http://127.0.0.1:15001/${projectId}/southamerica-east1/cardsApi`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) }, body: JSON.stringify({ data: { action, payload } }) })
  const data = await response.json()
  if (data.error) throw Object.assign(new Error(data.error.message), { code: data.error.status })
  assert.ok(response.ok, JSON.stringify(data))
  return data.result
}
const reject = (promise, code) => assert.rejects(promise, error => error.code === code)
before(async () => {
  rules = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile('firestore.rules', 'utf8') }, storage: { rules: await readFile('storage.rules', 'utf8') } })
  await rules.clearFirestore()
  ;[admin, alice, bob, carol] = await Promise.all(['admin', 'alice', 'bob', 'carol'].map(account))
  await db.collection('cardsAdmins').doc(admin.uid).set({ role: 'admin', active: true })
})
after(async () => { await rules?.cleanup(); await deleteApp(app) })
test('A: admin emite 300 cartões únicos e códigos protegidos no banco', async () => {
  batchId = randomUUID()
  assert.equal((await call('generate', { requestId: batchId }, admin)).quantity, 300)
  const kit = await call('exportBatch', { batchId }, admin)
  cards = kit.cards
  assert.equal(cards.length, 300)
  assert.equal(new Set(cards.map(c => c.id)).size, 300)
  assert.equal(new Set(cards.map(c => c.code)).size, 300)
  assert.ok(cards.every(c => c.status === 'disponivel' && !c.ownerId && c.url === `https://cards.example.test/cartoes/c/${c.id}`))
  const raw = (await db.collection('cardsInventory').doc(cards[0].id).get()).data()
  assert.ok(raw.codeEncrypted && !raw.code && !JSON.stringify(raw).includes(cards[0].code))
  assert.equal((await db.collection('cardsCodes').count().get()).data().count, 300)
})
test('emissão idempotente e unicidade entre lotes', async () => {
  await call('generate', { requestId: batchId }, admin)
  assert.equal((await db.collection('cardsInventory').count().get()).data().count, 300)
  const next = randomUUID()
  await call('generate', { quantity: 3, requestId: next }, admin)
  const extra = (await call('exportBatch', { batchId: next }, admin)).cards
  assert.equal(new Set([...cards, ...extra].map(c => c.code)).size, 303)
})
test('B: conta real do Auth ativa cartão pelo QR individual', async () => {
  const found = await call('resolve', { token: cards[0].id })
  assert.equal(found.status, 'disponivel')
  assert.equal(found.code, undefined)
  const result = await call('activate', { token: found.token }, alice)
  assert.equal(result.profileId, alice.uid)
  assert.equal((await db.collection('cardsInventory').doc(found.token).get()).data().ownerId, alice.uid)
})
test('C: QR geral permite identificação pelo código normalizado', async () => {
  const found = await call('resolve', { code: cards[1].code.toLowerCase().replaceAll('-', ' ') })
  assert.equal(found.token, cards[1].id)
  await call('activate', { code: cards[1].code }, bob)
  assert.equal((await call('session', {}, bob)).profile.cardId, cards[1].id)
})
test('D: QR ativo resolve para perfil sem revelar dados privados', async () => {
  await call('saveProfile', { name: 'Alice', username: 'alice_tokka', bio: 'Olá!', website: 'https://example.com', ownerId: bob.uid }, alice)
  const found = await call('resolve', { token: cards[0].id })
  assert.equal(found.profileId, alice.uid)
  const publicProfile = await call('publicProfile', { profileId: found.profileId })
  assert.equal(publicProfile.name, 'Alice')
  assert.deepEqual(Object.keys(publicProfile).sort(), ['profileId', 'name', 'username', 'bio', 'photoUrl', 'website'].sort())
  assert.equal((await call('session', {}, bob)).profile.name, '')
})
test('E: segunda conta não pode tomar posse; uma conta não pode ter dois cartões', async () => {
  await reject(call('activate', { token: cards[0].id }, carol), 'ALREADY_EXISTS')
  await reject(call('activate', { token: cards[2].id }, alice), 'ALREADY_EXISTS')
  assert.equal((await call('activate', { token: cards[0].id }, alice)).profileId, alice.uid)
})
test('F: duas ativações simultâneas confirmam somente um proprietário', async () => {
  const [first, second] = await Promise.all([account('race1'), account('race2')])
  const outcomes = await Promise.allSettled([call('activate', { token: cards[3].id }, first), call('activate', { token: cards[3].id }, second)])
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1)
  assert.equal(outcomes.find(r => r.status === 'rejected').reason.code, 'ALREADY_EXISTS')
  const count = await db.collection('cardsProfiles').where('cardId', '==', cards[3].id).count().get()
  assert.equal(count.data().count, 1)
})
test('G: painel, exportações e logs refletem o banco sem expor códigos na listagem', async () => {
  const panel = await call('dashboard', { batchId }, admin)
  assert.deepEqual(panel.counts, [303, 300, 3, 0])
  assert.equal(panel.cards.length, 300)
  assert.ok(panel.cards.every(c => !c.code && !c.codeEncrypted))
  assert.ok((await db.collection('cardsAudit').where('event', '==', 'activated').get()).size === 3)
})
test('H: bloqueio impede ativação e suspende perfil; não admins são recusados', async () => {
  await call('block', { token: cards[4].id }, admin)
  await reject(call('activate', { token: cards[4].id }, carol), 'FAILED_PRECONDITION')
  for (const [action, payload] of [['dashboard', {}], ['generate', { requestId: randomUUID() }], ['exportBatch', { batchId }], ['block', { token: cards[5].id }]]) await reject(call(action, payload, alice), 'PERMISSION_DENIED')
  await reject(call('dashboard'), 'UNAUTHENTICATED')
  await call('block', { token: cards[0].id }, admin)
  assert.equal((await call('resolve', { token: cards[0].id })).status, 'bloqueado')
  await reject(call('publicProfile', { profileId: alice.uid }), 'NOT_FOUND')
})
test('I: login posterior preserva vínculo; atualização de perfil exige dono e username exclusivo', async () => {
  const session = await call('session', {}, bob)
  assert.equal(session.profile.cardId, cards[1].id)
  await reject(call('saveProfile', { name: 'Bob', username: 'alice_tokka' }, bob), 'ALREADY_EXISTS')
  await call('saveProfile', { name: 'Bob', username: 'bob_tokka', profileId: alice.uid }, bob)
  assert.equal((await call('session', {}, alice)).profile.name, 'Alice')
  await reject(call('saveProfile', { name: 'Bad', username: 'valid', website: 'javascript:alert(1)' }, bob), 'INVALID_ARGUMENT')
})
test('regras negam dados privados e escrita direta, inclusive ao admin', async () => {
  for (const context of [rules.unauthenticatedContext(), rules.authenticatedContext(alice.uid), rules.authenticatedContext(admin.uid)]) {
    const firestore = context.firestore()
    for (const collection of ['cardsAdmins', 'cardsInventory', 'cardsCodes', 'cardsProfiles', 'cardsUsernames', 'cardsAudit', 'cardsLimits', 'cardsBatches']) {
      await assertFails(getDoc(doc(firestore, collection, alice.uid)))
      await assertFails(setDoc(doc(firestore, collection, alice.uid), { role: 'admin' }))
    }
  }
})
test('Storage: apenas dono envia foto válida; público não lê foto de cartão bloqueado', async () => {
  const ownStorage = rules.authenticatedContext(bob.uid).storage()
  const jpeg = new Uint8Array([255, 216, 255, 217])
  await uploadBytes(ref(ownStorage, `cards/profiles/${bob.uid}/avatar`), jpeg, { contentType: 'image/jpeg' })
  await assertFails(uploadBytes(ref(ownStorage, `cards/profiles/${alice.uid}/avatar`), jpeg, { contentType: 'image/jpeg' }))
  await assertFails(uploadBytes(ref(ownStorage, `cards/profiles/${bob.uid}/avatar`), jpeg, { contentType: 'image/svg+xml' }))
  await assertFails(uploadBytes(ref(ownStorage, `cards/profiles/${bob.uid}/avatar`), new Uint8Array(2 * 1024 * 1024 + 1), { contentType: 'image/jpeg' }))
  await uploadBytes(ref(rules.authenticatedContext(alice.uid).storage(), `cards/profiles/${alice.uid}/avatar`), jpeg, { contentType: 'image/jpeg' })
  await getBytes(ref(rules.unauthenticatedContext().storage(), `cards/profiles/${bob.uid}/avatar`))
  await assertFails(getBytes(ref(rules.unauthenticatedContext().storage(), `cards/profiles/${alice.uid}/avatar`)))
})
test('proteção contra força bruta recusa excesso de consultas', async () => {
  await db.recursiveDelete(db.collection('cardsLimits'))
  for (let i = 0; i < 60; i++) await reject(call('resolve', { code: 'INVALID' }), 'NOT_FOUND')
  await reject(call('resolve', { code: 'INVALID' }), 'RESOURCE_EXHAUSTED')
})

test('navegador: jornada completa, downloads e links antigos', { timeout: 360000 }, async () => {
  await db.recursiveDelete(db.collection('cardsLimits'))
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/cards.playwright.config.mjs'], { stdio: 'inherit', env: process.env })
    child.on('error', reject); child.on('exit', resolve)
  })
  assert.equal(code, 0, 'A jornada real no navegador precisa passar.')
})
