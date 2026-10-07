import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

const source = await readFile(new URL('../src/lib/menuPersistence.js', import.meta.url), 'utf8')
const restaurant = 'test-restaurant'
const slug = 'test-menu'
const menuPath = `restaurants/${restaurant}/settings/menus/items/${slug}`
const productPath = `restaurants/${restaurant}/menu`
const tick = () => new Promise(setImmediate)

async function fixture(items = []) {
  const documents = new Map()
  const listeners = new Set()
  const syncListeners = new Set()
  const cache = new Map()
  const batches = []
  const state = {
    version: 1,
    slug,
    profile: { name: 'Test', logo: 'logo.png' },
    categories: [],
    promoItems: [],
    products: items,
  }
  documents.set(menuPath, { ...state, products: [], productIds: items.map(item => item.id) })
  items.forEach(item => documents.set(`${productPath}/${item.id}`, item))
  let commitGate
  let failCommit = false
  const metadata = { fromCache: false, hasPendingWrites: false }
  const docSnapshot = path => ({
    id: path.split('/').at(-1),
    metadata: { ...metadata },
    exists: () => documents.has(path),
    data: () => documents.get(path),
  })
  const querySnapshot = (path, previous = new Map()) => {
    const entries = [...documents].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'))
    const current = new Map(entries)
    const changes = entries.filter(([key, value]) => JSON.stringify(previous.get(key)) !== JSON.stringify(value))
      .map(([key]) => ({ type: previous.has(key) ? 'modified' : 'added', doc: docSnapshot(key) }))
    for (const key of previous.keys()) {
      if (!current.has(key)) changes.push({ type: 'removed', doc: docSnapshot(key) })
    }
    return { docs: entries.map(([key]) => docSnapshot(key)), metadata: { ...metadata }, docChanges: () => changes, current }
  }
  const notify = () => {
    for (const listener of listeners) {
      const snapshot = listener.ref.kind === 'collection'
        ? querySnapshot(listener.ref.path, listener.previous)
        : docSnapshot(listener.ref.path)
      listener.previous = snapshot.current
      listener.next(snapshot)
    }
    syncListeners.forEach(callback => callback())
  }
  const firestore = {
    collection: (_db, ...parts) => ({ kind: 'collection', path: parts.join('/') }),
    doc: (parent, ...parts) => ({ kind: 'doc', path: [parent.path, ...parts].filter(Boolean).join('/') }),
    getDoc: async ref => docSnapshot(ref.path),
    getDocs: async ref => querySnapshot(ref.path),
    serverTimestamp: () => 'server-timestamp',
    onSnapshot: (ref, _options, next, error) => {
      const listener = { ref, next, error, previous: new Map() }
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onSnapshotsInSync: (_db, callback) => {
      syncListeners.add(callback)
      return () => syncListeners.delete(callback)
    },
    writeBatch: () => {
      const operations = []
      return {
        set: (ref, value, options) => operations.push({ type: 'set', path: ref.path, value, merge: options?.merge }),
        delete: ref => operations.push({ type: 'delete', path: ref.path }),
        commit: async () => {
          batches.push(operations)
          if (commitGate) await commitGate
          if (failCommit) { failCommit = false; throw new Error('permission-denied') }
          for (const operation of operations) {
            if (operation.type === 'delete') documents.delete(operation.path)
            else documents.set(operation.path, operation.merge ? { ...documents.get(operation.path), ...operation.value } : operation.value)
          }
          notify()
        },
      }
    },
  }
  const context = createContext({ console, window: { localStorage: { getItem: key => cache.get(key), setItem: (key, value) => cache.set(key, value) } } })
  const stub = exports => new SyntheticModule(Object.keys(exports), function () {
    Object.entries(exports).forEach(([name, value]) => this.setExport(name, value))
  }, { context })
  const module = new SourceTextModule(source, { context, initializeImportMeta: meta => { meta.env = { DEV: false } } })
  await module.link(specifier => specifier === 'firebase/firestore' ? stub(firestore) : stub({ db: {}, firebaseEnabled: true }))
  await module.evaluate()
  return {
    api: module.namespace, state, documents, batches, metadata, notify, listeners, syncListeners,
    holdCommits() { let release; commitGate = new Promise(resolve => { release = resolve }); return release },
    failNextCommit() { failCommit = true },
    emitError(error) { listeners.forEach(listener => listener.error(error)) },
  }
}

test('editing one item writes that item only, and an unchanged save writes nothing', async () => {
  const items = Array.from({ length: 120 }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}`, price: index }))
  const f = await fixture(items)
  await f.api.loadMenuState(restaurant, slug)
  const updated = { ...f.state, products: items.map(item => item.id === 'item-42' ? { ...item, price: 99 } : item) }
  assert.equal(await f.api.saveMenuState(restaurant, slug, updated), true)
  assert.equal(f.batches[0].length, 2)
  assert.equal(f.batches[0][0].path, `${productPath}/item-42`)
  assert.equal('profile' in f.batches[0][1].value, false)
  assert.equal('categories' in f.batches[0][1].value, false)
  assert.equal(await f.api.saveMenuState(restaurant, slug, updated), true)
  assert.equal(f.batches.length, 1)
})

test('add, toggle, delete and deleting the last item persist without restoring defaults', async () => {
  const f = await fixture([{ id: 'one', name: 'One', active: true }])
  await f.api.loadMenuState(restaurant, slug)
  const two = { id: 'two', name: 'Two', active: true }
  await f.api.saveMenuState(restaurant, slug, { ...f.state, products: [...f.state.products, two] })
  assert.equal(f.documents.has(`${productPath}/two`), true)
  await f.api.saveMenuState(restaurant, slug, { ...f.state, products: [{ ...two, active: false }] })
  assert.equal(f.documents.has(`${productPath}/one`), false)
  assert.equal(f.documents.get(`${productPath}/two`).active, false)
  await f.api.saveMenuState(restaurant, slug, { ...f.state, products: [] })
  assert.equal(f.documents.has(`${productPath}/two`), false)
  const loaded = await f.api.loadMenuState(restaurant, slug)
  assert.equal(loaded.products.length, 0)
})

test('overlapping saves commit in order and a stale snapshot cannot overwrite the newest local edit', async () => {
  const f = await fixture([{ id: 'one', name: 'Old' }])
  await f.api.loadMenuState(restaurant, slug)
  const updates = []
  const stop = f.api.watchMenuState(restaurant, slug, value => updates.push(value))
  f.notify()
  const release = f.holdCommits()
  const first = f.api.saveMenuState(restaurant, slug, { ...f.state, products: [{ id: 'one', name: 'First' }] })
  const second = f.api.saveMenuState(restaurant, slug, { ...f.state, products: [{ id: 'one', name: 'Latest' }] })
  await tick()
  assert.equal(f.batches.length, 1)
  f.notify()
  assert.equal(updates.at(-1).products[0].name, 'Latest')
  release()
  assert.equal(await first, true)
  assert.equal(await second, true)
  assert.equal(f.documents.get(`${productPath}/one`).name, 'Latest')
  assert.equal(f.api.readCachedMenuState(restaurant, slug).products[0].name, 'Latest')
  stop()
})

test('failed publication reports failure and retry still writes the unsaved change', async () => {
  const f = await fixture([{ id: 'one', price: 10 }])
  await f.api.loadMenuState(restaurant, slug)
  const updated = { ...f.state, products: [{ id: 'one', price: 20 }] }
  f.failNextCommit()
  assert.equal(await f.api.saveMenuState(restaurant, slug, updated), false)
  assert.equal(f.documents.get(`${productPath}/one`).price, 10)
  assert.equal(await f.api.saveMenuState(restaurant, slug, updated), true)
  assert.equal(f.documents.get(`${productPath}/one`).price, 20)
})

test('a first save without a loaded baseline reads existing products before deleting them', async () => {
  const f = await fixture([{ id: 'one', name: 'One' }, { id: 'two', name: 'Two' }])
  assert.equal(await f.api.saveMenuState(restaurant, slug, { ...f.state, products: [f.state.products[1]] }), true)
  assert.equal(f.documents.has(`${productPath}/one`), false)
  assert.equal(f.documents.has(`${productPath}/two`), true)
  assert.equal(f.batches[0].filter(operation => operation.type === 'set' && operation.path.startsWith(`${productPath}/`)).length, 0)
})

test('live snapshots combine metadata and product changes once and clean up listeners', async () => {
  const f = await fixture([{ id: 'one', price: 10 }])
  const updates = []
  const errors = []
  const stop = f.api.watchMenuState(restaurant, slug, value => updates.push(value), error => errors.push(error))
  f.notify()
  assert.equal(updates.length, 1)
  f.documents.set(`${productPath}/two`, { id: 'two', price: 20 })
  f.documents.delete(`${productPath}/one`)
  f.documents.set(menuPath, { ...f.documents.get(menuPath), productIds: ['two'] })
  f.notify()
  assert.equal(updates.length, 2)
  assert.equal(updates[1].products.length, 1)
  assert.equal(updates[1].products[0].id, 'two')
  f.notify()
  assert.equal(updates.length, 2)
  f.emitError(new Error('permission-denied'))
  assert.ok(errors.length)
  stop()
  assert.equal(f.listeners.size, 0)
  assert.equal(f.syncListeners.size, 0)
})

test('an empty initial SDK cache does not announce a missing menu or remove products', async () => {
  const f = await fixture([{ id: 'one', name: 'One' }])
  const updates = []
  f.metadata.fromCache = true
  const product = f.documents.get(`${productPath}/one`)
  f.documents.delete(`${productPath}/one`)
  const stop = f.api.watchMenuState(restaurant, slug, value => updates.push(value))
  f.notify()
  assert.equal(updates.length, 0)
  f.documents.set(`${productPath}/one`, product)
  f.metadata.fromCache = false
  f.notify()
  assert.equal(updates.length, 1)
  assert.equal(updates[0].products[0].name, 'One')
  stop()
})
