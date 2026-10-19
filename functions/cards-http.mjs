import { HttpsError } from 'firebase-functions/v2/https'

const actions = new Set(['session', 'generate', 'resolve', 'activate', 'saveProfile', 'saveLinks', 'publicProfile', 'dashboard', 'exportBatch', 'block', 'uploadImage'])
const statuses = { 'invalid-argument': 400, unauthenticated: 401, 'permission-denied': 403, 'not-found': 404, 'already-exists': 409, aborted: 409, 'failed-precondition': 409, 'resource-exhausted': 429 }
export function createCardsHttpHandler(auth, service) {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    const json = (status, value) => { response.statusCode = status; response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(value)) }
    try {
      const context = { rawRequest: { ip: String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim() } }
      if (request.method === 'GET') {
        const query = new URL(request.url, 'https://cards.invalid').searchParams
        const image = await service.publicImage(context, { profileId: query.get('image'), kind: query.get('kind') })
        response.setHeader('Content-Type', image.contentType)
        response.statusCode = 200
        return response.end(Buffer.from(image.data, 'base64'))
      }
      if (request.method !== 'POST') { response.setHeader('Allow', 'GET, POST'); return json(405, { error: { code: 'functions/invalid-argument', message: 'Método não permitido.' } }) }
      if (!String(request.headers['content-type'] || '').startsWith('application/json')) throw new HttpsError('invalid-argument', 'Envie uma solicitação JSON.')
      const body = request.body
      if (!body || Array.isArray(body) || typeof body !== 'object' || Buffer.byteLength(JSON.stringify(body)) > 800000 || !actions.has(body.action) || (body.payload != null && (typeof body.payload !== 'object' || Array.isArray(body.payload)))) throw new HttpsError('invalid-argument', 'Solicitação inválida.')
      if (request.headers.authorization) {
        const match = String(request.headers.authorization).match(/^Bearer (\S+)$/)
        if (!match) throw new HttpsError('unauthenticated', 'Entre na sua conta para continuar.')
        let token
        try { token = await auth.verifyIdToken(match[1], true) } catch { throw new HttpsError('unauthenticated', 'Entre novamente na sua conta.') }
        context.auth = { uid: token.uid, token }
      }
      return json(200, { data: await service[body.action](context, body.payload || {}) })
    } catch (error) {
      const known = error instanceof HttpsError
      return json(known ? statuses[error.code] || 500 : 500, { error: { code: `functions/${known ? error.code : 'internal'}`, message: known ? error.message : 'Não foi possível concluir. Tente novamente.' } })
    }
  }
}
