import assert from 'node:assert/strict'
import test from 'node:test'
import { HttpsError } from '../functions/node_modules/firebase-functions/lib/v2/providers/https.js'
import { createCardsHttpHandler } from '../functions/cards-http.mjs'

async function request(handler, overrides = {}) {
  const input = { method: 'POST', url: '/api/cards', headers: { 'content-type': 'application/json' }, body: { action: 'session', payload: {} }, ...overrides }
  const output = { headers: {}, setHeader(key, value) { this.headers[key] = value }, end(body) { this.body = body } }
  await handler(input, output)
  return { ...output, json: Buffer.isBuffer(output.body) ? null : JSON.parse(output.body) }
}
test('HTTP: identidade vem do token verificado, revogação é conferida e dados não ficam em cache', async () => {
  const auth = { async verifyIdToken(token, revoked) { assert.equal(token, 'valid'); assert.equal(revoked, true); return { uid: 'real-owner' } } }
  const handler = createCardsHttpHandler(auth, { session(context, payload) { assert.equal(context.auth.uid, 'real-owner'); assert.equal(payload.uid, 'forged-owner'); return { ok: true } } })
  const result = await request(handler, { headers: { 'content-type': 'application/json', authorization: 'Bearer valid' }, body: { action: 'session', payload: { uid: 'forged-owner' } } })
  assert.equal(result.statusCode, 200)
  assert.deepEqual(result.json, { data: { ok: true } })
  assert.equal(result.headers['Cache-Control'], 'private, no-store')
})
test('HTTP: token inválido ou revogado não alcança a operação; erro interno não vaza credenciais', async () => {
  let calls = 0
  const handler = createCardsHttpHandler({ async verifyIdToken() { throw new Error('private token') } }, { session() { calls++ } })
  const result = await request(handler, { headers: { 'content-type': 'application/json', authorization: 'Bearer invalid' } })
  assert.equal(result.statusCode, 401)
  assert.equal(calls, 0)
  assert.ok(!JSON.stringify(result.json).includes('private token'))
  const broken = await request(createCardsHttpHandler({}, { session() { throw new Error('private key') } }))
  assert.equal(broken.statusCode, 500)
  assert.ok(!JSON.stringify(broken.json).includes('private key'))
})
test('HTTP: ações, métodos, formato e tamanho são restritos', async () => {
  const handler = createCardsHttpHandler({}, {})
  for (const body of [{ action: 'constructor' }, { action: 'publicImage' }, { action: 'session', payload: [] }, { action: 'session', payload: { data: 'x'.repeat(800001) } }]) assert.equal((await request(handler, { body })).statusCode, 400)
  assert.equal((await request(handler, { method: 'DELETE' })).statusCode, 405)
  assert.equal((await request(handler, { headers: { 'content-type': 'text/plain' } })).statusCode, 400)
})
test('HTTP: erros esperados preservam código e imagens públicas são entregues como binário', async () => {
  const handler = createCardsHttpHandler({}, { session() { throw new HttpsError('permission-denied', 'Acesso restrito.') }, publicImage(context, data) { assert.deepEqual(data, { profileId: 'owner', kind: 'avatar' }); return { contentType: 'image/png', data: Buffer.from('image').toString('base64') } } })
  const denied = await request(handler)
  assert.equal(denied.statusCode, 403)
  assert.equal(denied.json.error.code, 'functions/permission-denied')
  const image = await request(handler, { method: 'GET', url: '/api/cards?image=owner&kind=avatar' })
  assert.equal(image.statusCode, 200)
  assert.equal(image.headers['Content-Type'], 'image/png')
  assert.equal(image.body.toString(), 'image')
})
