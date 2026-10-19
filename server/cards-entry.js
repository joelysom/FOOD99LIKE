import { cardsHttpRuntime } from '../functions/vercel-runtime.mjs'

export default async function handler(request, response) {
  try { return await cardsHttpRuntime()(request, response) }
  catch {
    response.statusCode = 503
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ error: { code: 'functions/unavailable', message: 'O serviço de cartões ainda está sendo configurado. Tente novamente em instantes.' } }))
  }
}
