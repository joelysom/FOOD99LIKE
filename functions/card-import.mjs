import { createHash, randomBytes } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'
import { isActivationCode, normalizeCode, sealActivationCode } from './cards-service.mjs'

const hash = value => createHash('sha256').update(value).digest('hex')
const fail = (code, message) => { throw new HttpsError(code, message) }

// Trusted operator tooling only. Never expose this function directly to public clients.
export async function importCardCodes(db, { codes, encryptionKey, origin, userId, requestId }) {
  if (!Array.isArray(codes) || codes.length < 1 || codes.length > 150 || codes.some(code => typeof code !== 'string' || !isActivationCode(normalizeCode(code)))) fail('invalid-argument', 'Informe de 1 a 150 códigos válidos de 8 ou 20 caracteres.')
  const normalized = codes.map(normalizeCode)
  if (new Set(normalized).size !== codes.length) fail('invalid-argument', 'Há códigos repetidos na lista.')
  if (typeof userId !== 'string' || !userId) fail('invalid-argument', 'Identifique o operador da importação.')
  let baseUrl
  try { baseUrl = new URL(origin) } catch { fail('invalid-argument', 'Informe a origem HTTPS do domínio atual.') }
  if (baseUrl.protocol !== 'https:' || baseUrl.hostname === 'localhost' || baseUrl.hostname.endsWith('.localhost') || /^127\./.test(baseUrl.hostname) || baseUrl.username || baseUrl.password || baseUrl.pathname !== '/' || baseUrl.search || baseUrl.hash) fail('invalid-argument', 'Informe a origem HTTPS do domínio atual.')
  // Validate encryption before starting any writes, including on resumed requests.
  sealActivationCode('', encryptionKey)
  const digest = hash(normalized.join('\n'))
  const batchId = requestId || `import-${digest.slice(0, 40)}`
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(batchId)) fail('invalid-argument', 'Identificador de importação inválido.')
  const batchRef = db.collection('cardsBatches').doc(batchId)
  const indices = normalized.map(code => db.collection('cardsCodes').doc(hash(code)))
  return db.runTransaction(async tx => {
    const existing = await tx.get(batchRef)
    if (existing.exists) {
      const batch = existing.data()
      if (batch.source !== 'import' || batch.importDigest !== digest || batch.state !== 'ready' || batch.origin !== baseUrl.origin) fail('already-exists', 'Este identificador pertence a outro lote.')
      return { batchId, quantity: batch.quantity, created: false }
    }
    const registered = await tx.getAll(...indices)
    if (registered.some(record => record.exists)) fail('already-exists', 'Um ou mais códigos já estão cadastrados. Nenhum cartão foi alterado.')
    const timestamp = FieldValue.serverTimestamp()
    tx.create(batchRef, { quantity: codes.length, generated: codes.length, state: 'ready', source: 'import', importDigest: digest, origin: baseUrl.origin, createdBy: userId, createdAt: timestamp, completedAt: timestamp })
    normalized.forEach((code, index) => {
      const token = randomBytes(24).toString('hex')
      const displayCode = code.match(code.length === 8 ? /.{1,4}/g : /.{1,5}/g).join('-')
      tx.create(indices[index], { cardId: token })
      tx.create(db.collection('cardsInventory').doc(token), { publicId: token, batchId, number: index + 1, status: 'disponivel', ownerId: null, createdAt: timestamp, activatedAt: null, codeEncrypted: sealActivationCode(displayCode, encryptionKey) })
    })
    tx.create(db.collection('cardsAudit').doc(), { event: 'batch_imported', userId, batchId, quantity: codes.length, createdAt: timestamp })
    return { batchId, quantity: codes.length, created: true }
  })
}
