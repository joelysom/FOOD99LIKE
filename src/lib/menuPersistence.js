import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, firebaseEnabled } from './firebase'

const menuStoragePrefix = 'food99like-menu-state'

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
    const menuRef = getMenuStateRef(restaurantId, slug)
    const menuSnapshot = await getDoc(menuRef)

    if (menuSnapshot.exists()) {
      const remoteState = menuSnapshot.data()
      cacheMenuState(restaurantId, slug, remoteState)
      return remoteState
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Menu state was loaded from local cache.', error)
    }
  }

  return cachedState
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

export async function saveMenuState(restaurantId, slug, menuState, { remote = true } = {}) {
  if (!slug || !menuState) return

  const nextState = {
    ...menuState,
    slug,
    clientUpdatedAt: new Date().toISOString(),
  }

  cacheMenuState(restaurantId, slug, nextState)

  if (!remote || !firebaseEnabled) return

  try {
    await setDoc(
      getMenuStateRef(restaurantId, slug),
      {
        ...nextState,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Menu state was saved only in local cache.', error)
    }
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
