import { collection, doc, getDoc, getDocs, onSnapshot, onSnapshotsInSync, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db, firebaseEnabled } from './firebase'

const menuStoragePrefix = 'food99like-menu-state'
const publishedStates = new Map()
const saveQueues = new Map()
const pendingStates = new Map()

export function readCachedMenuState(restaurantId, slug) {
  if (typeof window === 'undefined' || !slug) return null

  for (const key of getMenuStateKeys(restaurantId, slug)) {
    try {
      const rawValue = window.localStorage?.getItem(key)
      if (rawValue) return JSON.parse(rawValue)
    } catch {
      return null
    }
  }

  return null
}

export async function loadMenuState(restaurantId, slug) {
  if (!slug) return null

  const cachedState = readCachedMenuState(restaurantId, slug)

  if (!firebaseEnabled) {
    return cachedState
  }

  try {
    const [menuSnapshot, productSnapshot] = await Promise.all([
      getDoc(getMenuStateRef(restaurantId, slug)),
      getDocs(getProductCollectionRef(restaurantId)),
    ])

    if (menuSnapshot.exists()) {
      const state = assembleMenuState(menuSnapshot.data(), new Map(
        productSnapshot.docs.map((snapshot) => [snapshot.id, snapshot.data()]),
      ))
      if (!menuSnapshot.metadata.hasPendingWrites && !productSnapshot.metadata.hasPendingWrites) {
        publishedStates.set(getMenuStateKey(restaurantId, slug), state)
      }
      if (!pendingStates.has(getMenuStateKey(restaurantId, slug))) {
        cacheMenuState(restaurantId, slug, state)
      }
      return state
    }
    publishedStates.set(getMenuStateKey(restaurantId, slug), null)
    return null
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Menu state was loaded from local cache.', error)
    }
  }

  return cachedState
}

// Publish only after both listeners have processed the same Firestore change.
export function watchMenuState(restaurantId, slug, onChange, onError = () => {}) {
  if (!firebaseEnabled || !slug) {
    onChange(readCachedMenuState(restaurantId, slug))
    return () => {}
  }

  const key = getMenuStateKey(restaurantId, slug)
  const products = new Map()
  let menuSnapshot
  let productSnapshot
  let lastSignature
  let stopped = false

  const handleError = (error) => {
    if (!stopped) onError(error)
  }
  const stopMenu = onSnapshot(getMenuStateRef(restaurantId, slug), { includeMetadataChanges: true }, (snapshot) => {
    menuSnapshot = snapshot
  }, handleError)
  const stopProducts = onSnapshot(getProductCollectionRef(restaurantId), { includeMetadataChanges: true }, (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') products.delete(change.doc.id)
      else products.set(change.doc.id, change.doc.data())
    }
    productSnapshot = snapshot
  }, handleError)
  const stopSync = onSnapshotsInSync(db, () => {
    if (stopped || !menuSnapshot || !productSnapshot) return
    if (!menuSnapshot.exists() && menuSnapshot.metadata.fromCache) return

    const metadata = menuSnapshot.data()
    // An initial empty SDK cache is not a remotely deleted product list.
    if (productSnapshot.metadata.fromCache && metadata?.productIds?.some((id) => !products.has(id))) return

    const remoteState = metadata ? assembleMenuState(metadata, products) : null
    const pending = pendingStates.get(key)
    if (remoteState && !pending && !menuSnapshot.metadata.hasPendingWrites && !productSnapshot.metadata.hasPendingWrites) {
      publishedStates.set(key, remoteState)
    }
    const state = pending?.state ?? remoteState
    const signature = JSON.stringify(state ? { ...state, updatedAt: undefined } : null)
    if (signature === lastSignature) return
    lastSignature = signature
    if (state) cacheMenuState(restaurantId, slug, state)
    onChange(state)
  })

  return () => {
    stopped = true
    stopMenu()
    stopProducts()
    stopSync()
  }
}

export async function resolveRestaurantId(slug, fallbackRestaurantId = 'tokka-foods') {
  if (!firebaseEnabled || !slug) return fallbackRestaurantId

  try {
    const directorySnapshot = await getDoc(doc(db, 'menuDirectory', slug))
    return directorySnapshot.exists() && directorySnapshot.data().active !== false
      ? directorySnapshot.data().restaurantId
      : fallbackRestaurantId
  } catch {
    return fallbackRestaurantId
  }
}

export function saveMenuState(restaurantId, slug, menuState, { remote = true } = {}) {
  if (!slug || !menuState) return Promise.resolve(false)

  const nextState = {
    ...menuState,
    slug,
    clientUpdatedAt: new Date().toISOString(),
  }

  cacheMenuState(restaurantId, slug, nextState)

  if (!remote || !firebaseEnabled) return Promise.resolve(true)

  const key = getMenuStateKey(restaurantId, slug)
  const pending = { state: nextState }
  pendingStates.set(key, pending)
  // Serialize overlapping saves; a slower old commit must never win over a new edit.
  const queuedSave = (saveQueues.get(key) ?? Promise.resolve()).then(async () => {
    try {
      if (!publishedStates.has(key)) await loadMenuState(restaurantId, slug)
      const previous = publishedStates.get(key)
      const previousProducts = new Map((previous?.products ?? []).map((product) => [product.id, product]))
      const products = Array.isArray(nextState.products) ? nextState.products : []
      const productCollectionRef = getProductCollectionRef(restaurantId)
      const batch = writeBatch(db)
      let writes = 0

      const metadata = { ...nextState, products: [], productIds: products.map((product) => product.id) }
      const patch = {}
      for (const [field, value] of Object.entries(metadata)) {
        if (field === 'updatedAt' || field === 'clientUpdatedAt') continue
        const previousValue = field === 'products' ? [] : field === 'productIds'
          ? previous?.products?.map((product) => product.id)
          : previous?.[field]
        if (!previous || JSON.stringify(value) !== JSON.stringify(previousValue)) patch[field] = value
      }

      products.forEach((product) => {
        if (JSON.stringify(product) !== JSON.stringify(previousProducts.get(product.id))) {
          batch.set(doc(productCollectionRef, product.id), product)
          writes += 1
        }
        previousProducts.delete(product.id)
      })
      for (const id of previousProducts.keys()) {
        batch.delete(doc(productCollectionRef, id))
        writes += 1
      }

      if (writes || Object.keys(patch).length) {
        batch.set(getMenuStateRef(restaurantId, slug), {
          ...patch,
          products: [],
          clientUpdatedAt: nextState.clientUpdatedAt,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        await batch.commit()
      }
      publishedStates.set(key, nextState)
      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Menu state was saved only in local cache.', error)
      }
      return false
    } finally {
      if (pendingStates.get(key) === pending) pendingStates.delete(key)
    }
  })
  saveQueues.set(key, queuedSave)
  void queuedSave.then(() => {
    if (saveQueues.get(key) === queuedSave) saveQueues.delete(key)
  })
  return queuedSave
}

function assembleMenuState(metadata, products) {
  return {
    ...metadata,
    products: Array.isArray(metadata.productIds)
      ? metadata.productIds.map((id) => products.get(id)).filter(Boolean)
      : products.size ? [...products.values()] : metadata.products ?? [],
  }
}

function cacheMenuState(restaurantId, slug, menuState) {
  if (typeof window === 'undefined') return

  try {
    const serializedState = JSON.stringify(menuState)
    getMenuStateKeys(restaurantId, slug).forEach((key) => {
      window.localStorage?.setItem(key, serializedState)
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Menu state cache failed.', error)
    }
  }
}

function getMenuStateRef(restaurantId, slug) {
  return doc(db, 'restaurants', restaurantId, 'settings', 'menus', 'items', slug)
}

function getProductCollectionRef(restaurantId) {
  return collection(db, 'restaurants', restaurantId, 'menu')
}

function getMenuStateKey(restaurantId, slug) {
  return `${menuStoragePrefix}:${restaurantId}:${slug}`
}

function getMenuStateSlugKey(slug) {
  return `${menuStoragePrefix}:slug:${slug}`
}

function getMenuStateKeys(restaurantId, slug) {
  return [...new Set([
    restaurantId && slug ? getMenuStateKey(restaurantId, slug) : '',
    slug ? getMenuStateSlugKey(slug) : '',
  ].filter(Boolean))]
}
