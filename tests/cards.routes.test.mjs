import assert from 'node:assert/strict'
import test from 'node:test'
import { getCardsRoute } from '../src/cards/routes.js'
test('novas rotas ficam restritas a /cartoes', () => {
  assert.deepEqual(getCardsRoute('/cartoes'), { page: 'activate' })
  assert.equal(getCardsRoute('/cartoes/cadastro').page, 'activate')
  assert.equal(getCardsRoute('/cartoes/conta').page, 'account')
  assert.equal(getCardsRoute('/cartoes/admin').page, 'admin')
  const token = 'a'.repeat(48)
  assert.deepEqual(getCardsRoute(`/cartoes/c/${token}`), { page: 'activate', token })
  assert.deepEqual(getCardsRoute('/cartoes/p/user_123'), { page: 'public', profileId: 'user_123' })
  for (const path of ['/', '/c/8Ks29', '/cartoes/c/invalid', '/cartoes/admin/extra', '/cartoes/p/../admin', '/cartoes2']) assert.equal(getCardsRoute(path).page, 'missing')
})
