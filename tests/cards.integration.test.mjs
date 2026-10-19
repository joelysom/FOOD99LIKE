import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test, { before, after } from 'node:test'
import { initializeApp, deleteApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js'
import { getAuth } from '../functions/node_modules/firebase-admin/lib/esm/auth/index.js'
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js'
import { importCardCodes } from '../functions/card-import.mjs'
import { createCardsService } from '../functions/cards-service.mjs'
import { createCardsHttpHandler } from '../functions/cards-http.mjs'
import { createLocalCardsServer } from '../functions/local-http-server.mjs'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getBytes } from 'firebase/storage'
const projectId = 'demo-tokka-cards'
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Execute npm run test:cards:integration; testes nunca acessam produção.')
const app = initializeApp({ projectId }), db = getFirestore(app)
const useHttp = process.env.CARDS_TEST_HTTP === 'true'
let httpServer
let rules, batchId, cards, alice, bob, admin, carol
async function account(name) {
  const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${name}-${randomUUID()}@test.local`, password: 'Secret123!', returnSecureToken: true }) })
  const data = await response.json()
  assert.ok(response.ok, JSON.stringify(data))
  return { uid: data.localId, token: data.idToken }
}
async function call(action, payload = {}, user = null) {
  const response = await fetch(useHttp ? 'http://127.0.0.1:15002/api/cards' : `http://127.0.0.1:15001/${projectId}/southamerica-east1/cardsApi`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) }, body: JSON.stringify(useHttp ? { action, payload } : { data: { action, payload } }) })
  const data = await response.json()
  if (data.error) throw Object.assign(new Error(data.error.message), { code: data.error.status || data.error.code.replace('functions/', '').replaceAll('-', '_').toUpperCase() })
  assert.ok(response.ok, JSON.stringify(data))
  return data.result ?? data.data
}
const reject = (promise, code) => assert.rejects(promise, error => error.code === code)
before(async () => {
  rules = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile('firestore.rules', 'utf8') }, ...(!useHttp ? { storage: { rules: await readFile('storage.rules', 'utf8') } } : {}) })
  await rules.clearFirestore()
  ;[admin, alice, bob, carol] = await Promise.all(['admin', 'alice', 'bob', 'carol'].map(account))
  await db.collection('cardsAdmins').doc(admin.uid).set({ role: 'admin', active: true })
  if (useHttp) {
    const secret = (await readFile('functions/.secret.local', 'utf8')).match(/^CARDS_EXPORT_KEY=(.+)$/m)[1]
    const service = createCardsService(db, () => secret, () => 'https://cards.example.test')
    httpServer = createLocalCardsServer(createCardsHttpHandler(getAuth(app), service))
    await new Promise((resolve, reject) => { httpServer.once('error', reject); httpServer.listen(15002, '127.0.0.1', resolve) })
  }
})
after(async () => { if (httpServer) await new Promise(resolve => httpServer.close(resolve)); await rules?.cleanup(); await deleteApp(app) })
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
  assert.deepEqual(Object.keys(publicProfile).sort(), ['profileId', 'name', 'username', 'bio', 'photoUrl', 'website', 'role', 'company', 'location', 'phone', 'contactEmail', 'companyLogoUrl', 'photoX', 'photoY', 'photoZoom', 'links'].sort())
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
test('Contact: campos e links reais, privacidade, revisão e validação no servidor', async () => {
  await call('saveProfile', { name: 'Bob', username: 'bob_tokka', role: 'Diretor', company: 'Empresa', phone: '+5581999999999', contactEmail: 'publico@example.com', location: 'Recife', companyLogoUrl: 'https://example.com/logo.png', photoX: 30, photoY: 60, photoZoom: 1.5 }, bob)
  const links = [
    { id: 'whatsapp', type: 'whatsapp', title: 'WhatsApp', value: '+5581999999999', enabled: true },
    { id: 'pix', type: 'pix', title: 'Minha chave', value: 'pix@example.com', enabled: true },
    { id: 'private-link', type: 'url', title: 'Oculto', value: 'https://example.com/private', enabled: false },
  ]
  const result = await call('saveLinks', { links, revision: 0, profileId: alice.uid }, bob)
  assert.equal(result.revision, 1)
  const published = await call('publicProfile', { profileId: bob.uid })
  assert.equal(published.role, 'Diretor')
  assert.equal(published.contactEmail, 'publico@example.com')
  assert.equal(published.email, undefined)
  assert.equal(published.photoZoom, 1.5)
  assert.deepEqual(published.links.map(link => link.id), ['whatsapp', 'pix'])
  assert.equal((await call('session', {}, alice)).profile.links, undefined)
  await reject(call('saveLinks', { links: [], revision: 0 }, bob), 'ABORTED')
  await reject(call('saveLinks', { links: [{ ...links[0], type: 'url', value: 'javascript:alert(1)' }], revision: 1 }, bob), 'INVALID_ARGUMENT')
  await reject(call('saveLinks', { links: [links[0], links[0]], revision: 1 }, bob), 'INVALID_ARGUMENT')
  await reject(call('saveLinks', { links: Array.from({ length: 21 }, (_, i) => ({ ...links[0], id: `link-${i}` })), revision: 1 }, bob), 'INVALID_ARGUMENT')
  await reject(call('saveLinks', { links: [], revision: 0 }, carol), 'FAILED_PRECONDITION')
  await reject(call('saveProfile', { name: 'Bob', username: 'bob_tokka', contactEmail: 'bad email', photoZoom: 50 }, bob), 'INVALID_ARGUMENT')
  await call('saveLinks', { links: [links[1], links[0]], revision: 1 }, bob)
  assert.deepEqual((await call('publicProfile', { profileId: bob.uid })).links.map(link => link.id), ['pix', 'whatsapp'])
})

test('regras negam dados privados e escrita direta, inclusive ao admin', async () => {
  for (const context of [rules.unauthenticatedContext(), rules.authenticatedContext(alice.uid), rules.authenticatedContext(admin.uid)]) {
    const firestore = context.firestore()
    for (const collection of ['cardsAdmins', 'cardsInventory', 'cardsCodes', 'cardsProfiles', 'cardsUsernames', 'cardsAudit', 'cardsLimits', 'cardsBatches']) {
      await assertFails(getDoc(doc(firestore, collection, alice.uid)))
      await assertFails(setDoc(doc(firestore, collection, alice.uid), { role: 'admin' }))
    }
    await assertFails(getDoc(doc(firestore, 'cardsImages', alice.uid, 'files', 'avatar')))
    await assertFails(setDoc(doc(firestore, 'cardsImages', alice.uid, 'files', 'avatar'), { data: 'private' }))
  }
})
test('Storage: apenas dono envia foto válida; público não lê foto de cartão bloqueado', { skip: useHttp }, async () => {
  const ownStorage = rules.authenticatedContext(bob.uid).storage()
  const jpeg = new Uint8Array([255, 216, 255, 217])
  await uploadBytes(ref(ownStorage, `cards/profiles/${bob.uid}/avatar`), jpeg, { contentType: 'image/jpeg' })
  await uploadBytes(ref(ownStorage, `cards/profiles/${bob.uid}/company-logo`), jpeg, { contentType: 'image/jpeg' })
  await assertFails(uploadBytes(ref(ownStorage, `cards/profiles/${bob.uid}/arbitrary-file`), jpeg, { contentType: 'image/jpeg' }))
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

test('importação: 51 códigos curtos, retomada, colisões e ativação sem contas fictícias', async () => {
  await db.recursiveDelete(db.collection('cardsLimits'))
  const codes = Array.from({ length: 51 }, () => `1${randomBytes(4).toString('hex').slice(0, 7).toUpperCase()}`)
  const secret = (await readFile('functions/.secret.local', 'utf8')).match(/^CARDS_EXPORT_KEY=(.+)$/m)[1]
  const options = { codes, encryptionKey: Buffer.from(secret, 'base64'), origin: 'https://cards.example.test', userId: admin.uid }
  const usersBefore = (await getAuth(app).listUsers()).users.length
  const imported = await importCardCodes(db, options)
  assert.equal(imported.quantity, 51)
  assert.equal(imported.created, true)
  assert.equal((await getAuth(app).listUsers()).users.length, usersBefore)
  const inventory = await db.collection('cardsInventory').where('batchId', '==', imported.batchId).get()
  assert.equal(inventory.size, 51)
  assert.equal(new Set(inventory.docs.map(doc => doc.id)).size, 51)
  for (const code of codes) {
    const found = await call('resolve', { code: `${code.slice(0, 4)}-${code.slice(4)}`.toLowerCase() })
    assert.equal(found.status, 'disponivel')
    const record = (await db.collection('cardsInventory').doc(found.token).get()).data()
    assert.equal(record.ownerId, null)
    assert.ok(record.codeEncrypted && !JSON.stringify(record).includes(code))
  }
  const claimant = await account('short-code')
  const claimed = await call('activate', { code: codes[0] }, claimant)
  assert.equal((await call('session', {}, claimant)).profile.cardId, claimed.token)
  assert.equal((await importCardCodes(db, options)).created, false)
  assert.equal((await call('resolve', { code: codes[0] })).profileId, claimant.uid)
  await reject(call('activate', { code: codes[0] }, carol), 'ALREADY_EXISTS')
  const exported = await call('exportBatch', { batchId: imported.batchId }, admin)
  assert.deepEqual(exported.cards.map(card => card.code.replaceAll('-', '')), codes)
  await reject(importCardCodes(db, { ...options, codes: [codes[0], 'ZZZZZZZZ'], requestId: randomUUID() }), 'already-exists')
  const missingHash = createHash('sha256').update('ZZZZZZZZ').digest('hex')
  assert.equal((await db.collection('cardsCodes').doc(missingHash).get()).exists, false)
  await reject(importCardCodes(db, { ...options, codes: [codes[0], codes[0].toLowerCase()] }), 'invalid-argument')
  await reject(importCardCodes(db, { ...options, encryptionKey: Buffer.alloc(2) }), 'failed-precondition')
  await reject(call('resolve', { code: 'ZZZZZZZZ' }), 'NOT_FOUND')
  assert.equal((await db.collection('cardsInventory').where('batchId', '==', imported.batchId).get()).size, 51)
})

test('imagens sem Storage: upload exige dono, valida bytes e bloqueio suspende acesso público', async () => {
  const owner = await account('image-owner')
  await call('activate', { token: cards[6].id }, owner)
  const secret = (await readFile('functions/.secret.local', 'utf8')).match(/^CARDS_EXPORT_KEY=(.+)$/m)[1]
  const service = createCardsService(db, () => secret, () => 'https://cards.example.test')
  const context = { auth: { uid: owner.uid }, rawRequest: { ip: 'image-test' } }
  const data = { kind: 'avatar', contentType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6x8AAAAASUVORK5CYII=' }
  const saved = await service.uploadImage(context, data)
  assert.ok(saved.url.startsWith(`https://cards.example.test/api/cards?image=${owner.uid}&kind=avatar`))
  assert.equal((await service.publicImage({ rawRequest: { ip: 'image-test' } }, { profileId: owner.uid, kind: 'avatar' })).data, data.data)
  await reject(service.uploadImage({}, data), 'unauthenticated')
  await reject(service.uploadImage({ auth: { uid: carol.uid } }, data), 'failed-precondition')
  await reject(service.uploadImage(context, { ...data, data: Buffer.from('<svg></svg>').toString('base64') }), 'invalid-argument')
  await reject(service.uploadImage(context, { ...data, kind: '../secret' }), 'invalid-argument')
  await call('block', { token: cards[6].id }, admin)
  await reject(service.publicImage({}, { profileId: owner.uid, kind: 'avatar' }), 'not-found')
  await reject(service.uploadImage(context, data), 'permission-denied')
})

test('navegador: jornada completa, downloads e links antigos', { timeout: 360000 }, async () => {
  await db.recursiveDelete(db.collection('cardsLimits'))
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/cards.playwright.config.mjs'], { stdio: 'inherit', env: { ...process.env, ...(useHttp ? { CARDS_TEST_HTTP_RUNNING: 'true' } : {}) } })
    child.on('error', reject); child.on('exit', resolve)
  })
  assert.equal(code, 0, 'A jornada real no navegador precisa passar.')
})
