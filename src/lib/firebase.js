import { firebaseConfig } from './firebaseConfig'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const env = import.meta.env

export { firebaseConfig } from './firebaseConfig'

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true,
})
export const storage = getStorage(firebaseApp)

export const analyticsPromise =
  typeof window === 'undefined'
    ? Promise.resolve(null)
    : isAnalyticsSupported()
        .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
        .catch(() => null)

export const firebaseEnabled = env.VITE_FIREBASE_ENABLED !== 'false'
