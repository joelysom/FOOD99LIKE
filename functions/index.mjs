import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { createCardsService } from './cards-service.mjs'
initializeApp()
const exportKey = defineSecret('CARDS_EXPORT_KEY')
const publicOrigin = defineString('CARDS_PUBLIC_ORIGIN', { description: 'Origem HTTPS atual do domínio TOKKA, sem caminho.' })
const service = createCardsService(getFirestore(), () => exportKey.value(), () => publicOrigin.value())
export const cardsApi = onCall({ region: 'southamerica-east1', secrets: [exportKey], timeoutSeconds: 120, memory: '256MiB', maxInstances: 10 }, async request => {
  request.rawRequest.res?.setHeader('Cache-Control', 'no-store')
  const allowed = ['session', 'generate', 'resolve', 'activate', 'saveProfile', 'publicProfile', 'dashboard', 'exportBatch', 'block']
  const action = request.data?.action
  if (!allowed.includes(action)) throw new HttpsError('invalid-argument', 'Operação desconhecida.')
  try { return await service[action](request, request.data?.payload || {}) }
  catch (error) {
    if (error instanceof HttpsError) throw error
    // Never log payloads, codes, decrypted exports or authentication tokens.
    throw new HttpsError('internal', 'Não foi possível concluir. Tente novamente; emissões podem ser retomadas.')
  }
})
