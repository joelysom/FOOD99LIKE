import { createServer } from 'node:http'
export function createLocalCardsServer(handler) {
  return createServer(async (request, response) => {
    if (request.url === '/health') { response.writeHead(200); response.end('ok'); return }
    let size = 0
    const chunks = []
    for await (const chunk of request) {
      size += chunk.length
      if (size > 800000) { response.writeHead(413, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: { code: 'functions/invalid-argument', message: 'Solicitação muito grande.' } })); return }
      chunks.push(chunk)
    }
    const text = Buffer.concat(chunks).toString('utf8')
    if (text) { try { request.body = JSON.parse(text) } catch { response.writeHead(400); response.end(); return } }
    return handler(request, response)
  })
}
