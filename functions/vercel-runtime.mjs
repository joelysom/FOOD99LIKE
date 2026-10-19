import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { createCardsService } from './cards-service.mjs'
import { createCardsHttpHandler } from './cards-http.mjs'

let handler
export function cardsHttpRuntime() {
  if (handler) return handler
  const emulator = process.env.CARDS_HTTP_EMULATORS === 'true' && process.env.NODE_ENV !== 'production'
  const credentials = emulator ? null : JSON.parse(process.env.CARDS_FIREBASE_SERVICE_ACCOUNT || '{}')
  if (!emulator && (credentials.project_id !== 'tokka-foods' || !credentials.private_key || !process.env.CARDS_EXPORT_KEY)) throw new Error('Cards server configuration is incomplete.')
  const app = getApps().find(app => app.name === 'tokka-cards-server') || initializeApp(emulator ? { projectId: 'demo-tokka-cards' } : { credential: cert(credentials), projectId: credentials.project_id }, 'tokka-cards-server')
  const service = createCardsService(getFirestore(app), () => process.env.CARDS_EXPORT_KEY, () => process.env.CARDS_PUBLIC_ORIGIN)
  handler = createCardsHttpHandler(getAuth(app), service)
  return handler
}
