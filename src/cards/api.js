import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { firebaseConfig } from '../lib/firebaseConfig'
// Separate persisted session, same Firebase identities; restaurant logins remain independent.
const emulated = import.meta.env.DEV && import.meta.env.VITE_CARDS_EMULATORS === 'true'
const config = emulated ? { ...firebaseConfig, projectId: 'demo-tokka-cards', storageBucket: 'demo-tokka-cards.appspot.com' } : firebaseConfig
const app = getApps().find(app => app.name === 'tokka-cards') || initializeApp(config, 'tokka-cards')
export const cardsAuth = getAuth(app)
export const cardsStorage = getStorage(app)
const functions = getFunctions(app, 'southamerica-east1')
if (emulated) {
  connectAuthEmulator(cardsAuth, `http://127.0.0.1:${import.meta.env.VITE_CARDS_AUTH_PORT || 9099}`, { disableWarnings: true })
  connectFunctionsEmulator(functions, '127.0.0.1', Number(import.meta.env.VITE_CARDS_FUNCTIONS_PORT || 5001))
  connectStorageEmulator(cardsStorage, '127.0.0.1', Number(import.meta.env.VITE_CARDS_STORAGE_PORT || 9199))
}
const callable = httpsCallable(functions, 'cardsApi', { timeout: 120000 })
export async function cardsApi(action, payload = {}) {
  return (await callable({ action, payload })).data
}
export function friendlyError(error) {
  if (error?.code === 'auth/email-already-in-use') return 'Este e-mail já possui uma conta. Use a opção Entrar.'
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error?.code)) return 'E-mail ou senha incorretos.'
  if (error?.code === 'auth/weak-password') return 'Escolha uma senha com pelo menos 8 caracteres.'
  if (error?.code === 'auth/invalid-email') return 'Informe um e-mail válido.'
  if (error?.code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos.'
  if (error?.code === 'auth/operation-not-allowed') return 'O acesso por e-mail ainda precisa ser habilitado no Firebase.'
  if (['functions/unavailable', 'functions/internal', 'auth/network-request-failed'].includes(error?.code)) return 'Não foi possível conectar ao serviço. Confira a conexão e tente novamente.'
  return error?.message?.replace(/^Firebase:\s*/, '') || 'Não foi possível concluir. Tente novamente.'
}
