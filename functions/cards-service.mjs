import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'
import { contactFields, contactLinks, publicContactFields, httpsUrl } from './contact-profile.mjs'
const fail = (code, message) => { throw new HttpsError(code, message) }
const hash = value => createHash('sha256').update(value).digest('hex')
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const tokenPattern = /^[a-f0-9]{48}$/
export const normalizeCode = value => String(value ?? '').toUpperCase().replace(/[\s-]/g, '')
const stamp = () => FieldValue.serverTimestamp()
const serial = doc => Object.fromEntries(Object.entries({ id: doc.id, ...doc.data() }).map(([k, v]) => [k, v?.toDate ? v.toDate().toISOString() : v]))
export function createCardsService(db, keyProvider, originProvider) {
  const col = name => db.collection(`cards${name}`)
  function key() {
    const value = Buffer.from(keyProvider(), 'base64')
    if (value.length !== 32) fail('failed-precondition', 'Chave de emissão não configurada.')
    return value
  }
  function seal(code) {
    const nonce = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key(), nonce)
    const ciphertext = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()])
    return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64')
  }
  function unseal(value) {
    const packed = Buffer.from(value, 'base64')
    const cipher = createDecipheriv('aes-256-gcm', key(), packed.subarray(0, 12))
    cipher.setAuthTag(packed.subarray(12, 28))
    return Buffer.concat([cipher.update(packed.subarray(28)), cipher.final()]).toString('utf8')
  }
  function origin() {
    let url
    try { url = new URL(originProvider()) } catch { fail('failed-precondition', 'Configure o domínio de emissão.') }
    if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || /^127\./.test(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) fail('failed-precondition', 'A emissão exige a origem HTTPS do domínio de produção.')
    return url.origin
  }
  const uid = context => context.auth?.uid || fail('unauthenticated', 'Entre na sua conta para continuar.')
  async function admin(context) {
    const userId = uid(context)
    const record = await col('Admins').doc(userId).get()
    if (!record.exists || record.data().active !== true || record.data().role !== 'admin') fail('permission-denied', 'Acesso exclusivo à equipe de cartões TOKKA.')
    return userId
  }
  async function limit(context, action, maximum = 20) {
    const identities = [`ip:${context.rawRequest?.ip || 'unknown'}`]
    if (context.auth?.uid) identities.push(`uid:${context.auth.uid}`)
    const now = Date.now(), windowId = Math.floor(now / 60000)
    const refs = identities.map(identity => col('Limits').doc(hash(`${action}:${identity}:${windowId}`)))
    await db.runTransaction(async tx => {
      const snapshots = await tx.getAll(...refs)
      if (snapshots.some(s => (s.data()?.count || 0) >= maximum)) fail('resource-exhausted', 'Muitas tentativas. Aguarde um minuto e tente novamente.')
      refs.forEach((ref, i) => tx.set(ref, { count: (snapshots[i].data()?.count || 0) + 1, expiresAt: Timestamp.fromMillis(now + 120000) }))
    })
  }
  function audit(tx, event, userId, cardId = null, batchId = null) { tx.create(col('Audit').doc(), { event, userId, cardId, batchId, createdAt: stamp() }) }
  async function find(data) {
    if (data.token) {
      if (!tokenPattern.test(data.token)) fail('not-found', 'Cartão não encontrado. Confira o código.')
      return col('Inventory').doc(data.token)
    }
    const code = normalizeCode(data.code)
    if (!/^[2-9A-HJ-NP-Z]{20}$/.test(code)) fail('not-found', 'Cartão não encontrado. Confira o código.')
    const index = await col('Codes').doc(hash(code)).get()
    if (!index.exists) fail('not-found', 'Cartão não encontrado. Confira o código.')
    return col('Inventory').doc(index.data().cardId)
  }
  function available(card, ownerId) {
    if (!card) fail('not-found', 'Cartão não encontrado.')
    if (card.status === 'bloqueado') fail('failed-precondition', 'Este cartão está bloqueado. Entre em contato com a TOKKA.')
    if (card.status === 'ativado' && card.ownerId !== ownerId) fail('already-exists', 'Este cartão já foi ativado por outra pessoa.')
  }
  async function ready(tx, card) {
    const batch = await tx.get(col('Batches').doc(card.batchId))
    if (batch.data()?.state !== 'ready') fail('failed-precondition', 'Este lote ainda está sendo emitido. Tente novamente em instantes.')
  }
  return {
    async session(context) {
      const userId = uid(context)
      const [access, profile] = await Promise.all([col('Admins').doc(userId).get(), col('Profiles').doc(userId).get()])
      return { isAdmin: access.data()?.active === true && access.data()?.role === 'admin', profile: profile.exists ? serial(profile) : null }
    },
    async generate(context, data) {
      const userId = await admin(context)
      await limit(context, 'generate', 10)
      const quantity = data.quantity ?? 300
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) fail('invalid-argument', 'Escolha de 1 a 1.000 cartões.')
      if (!/^[a-zA-Z0-9-]{16,64}$/.test(data.requestId || '')) fail('invalid-argument', 'Identificador de emissão inválido.')
      const baseUrl = origin()
      key()
      const batchRef = col('Batches').doc(data.requestId)
      await db.runTransaction(async tx => {
        const current = await tx.get(batchRef)
        if (current.exists) {
          if (current.data().createdBy !== userId || current.data().quantity !== quantity) fail('already-exists', 'Esta emissão pertence a outra solicitação.')
          return
        }
        tx.create(batchRef, { quantity, generated: 0, state: 'generating', origin: baseUrl, createdBy: userId, createdAt: stamp() })
        audit(tx, 'batch_started', userId, null, batchRef.id)
      })
      // Chunks under 500 writes; retrying the requestId resumes an interrupted batch.
      for (;;) {
        const done = await db.runTransaction(async tx => {
          const batch = (await tx.get(batchRef)).data()
          if (batch.state === 'ready') return true
          const count = Math.min(150, quantity - batch.generated)
          if (!count) { tx.update(batchRef, { state: 'ready', completedAt: stamp() }); audit(tx, 'batch_completed', userId, null, batchRef.id); return true }
          const entries = Array.from({ length: count }, (_, i) => {
            let code = ''
            while (code.length < 20) for (const byte of randomBytes(32)) {
              if (byte < Math.floor(256 / alphabet.length) * alphabet.length && code.length < 20) code += alphabet[byte % alphabet.length]
            }
            return { code, id: randomBytes(24).toString('hex'), number: batch.generated + i + 1 }
          })
          for (const entry of entries) {
            tx.create(col('Codes').doc(hash(entry.code)), { cardId: entry.id })
            tx.create(col('Inventory').doc(entry.id), { publicId: entry.id, batchId: batchRef.id, number: entry.number, status: 'disponivel', ownerId: null, createdAt: stamp(), activatedAt: null, codeEncrypted: seal(entry.code.match(/.{1,5}/g).join('-')) })
          }
          tx.update(batchRef, { generated: batch.generated + count })
          return false
        })
        if (done) break
      }
      return { batchId: batchRef.id, quantity }
    },
    async resolve(context, data) {
      await limit(context, 'resolve', 60)
      const ref = await find(data)
      return db.runTransaction(async tx => {
        const card = (await tx.get(ref)).data()
        if (!card) fail('not-found', 'Cartão não encontrado. Confira o código.')
        await ready(tx, card)
        return { token: ref.id, status: card.status, profileId: card.status === 'ativado' ? card.ownerId : null }
      })
    },
    async activate(context, data) {
      const userId = uid(context)
      await limit(context, 'activate', 12)
      try {
        const ref = await find(data)
        return await db.runTransaction(async tx => {
          const profileRef = col('Profiles').doc(userId)
          const [snapshot, profile] = await tx.getAll(ref, profileRef)
          const card = snapshot.data()
          available(card, userId)
          await ready(tx, card)
          if (profile.exists && profile.data().cardId !== ref.id) fail('already-exists', 'Sua conta já possui um cartão TOKKA.')
          if (card.status === 'ativado') return { profileId: userId, token: ref.id }
          tx.update(ref, { ownerId: userId, status: 'ativado', activatedAt: stamp() })
          tx.create(profileRef, { cardId: ref.id, name: '', username: '', photoUrl: '', bio: '', website: '', createdAt: stamp(), updatedAt: stamp() })
          audit(tx, 'activated', userId, ref.id, card.batchId)
          return { profileId: userId, token: ref.id }
        })
      } catch (error) {
        await col('Audit').add({ event: 'activation_refused', userId, result: error.code || 'internal', createdAt: stamp() })
        throw error
      }
    },
    async saveProfile(context, data) {
      const userId = uid(context)
      await limit(context, 'profile', 20)
      const { name, bio = '', photoUrl = '', website = '' } = data
      const contact = contactFields(data)
      const username = String(data.username || '').trim().toLowerCase()
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 || !/^[a-z0-9_]{3,30}$/.test(username) || typeof bio !== 'string' || bio.length > 600) fail('invalid-argument', 'Confira nome, usuário (3–30 letras, números ou _) e bio (até 600 caracteres).')
      httpsUrl(photoUrl)
      httpsUrl(website)
      await db.runTransaction(async tx => {
        const ref = col('Profiles').doc(userId), current = await tx.get(ref)
        if (!current.exists) fail('failed-precondition', 'Ative seu cartão antes de editar o perfil.')
        const usernameRef = col('Usernames').doc(username)
        const [reserved, card] = await tx.getAll(usernameRef, col('Inventory').doc(current.data().cardId))
        if (card.data()?.ownerId !== userId) fail('permission-denied', 'Este perfil não pertence à sua conta.')
        if (reserved.exists && reserved.data().uid !== userId) fail('already-exists', 'Este nome de usuário já está em uso.')
        const old = current.data().username
        if (old && old !== username) tx.delete(col('Usernames').doc(old))
        tx.set(usernameRef, { uid: userId })
        tx.update(ref, { name: name.trim(), username, bio: bio.trim(), photoUrl, website, ...contact, updatedAt: stamp() })
      })
      return { profileId: userId }
    },
    async saveLinks(context, data) {
      const userId = uid(context)
      await limit(context, 'links', 40)
      const links = contactLinks(data.links)
      if (!Number.isSafeInteger(data.revision) || data.revision < 0) fail('invalid-argument', 'Revisão dos links inválida.')
      return db.runTransaction(async tx => {
        const ref = col('Profiles').doc(userId)
        const profile = await tx.get(ref)
        if (!profile.exists) fail('failed-precondition', 'Ative seu cartão antes de editar os links.')
        const card = await tx.get(col('Inventory').doc(profile.data().cardId))
        if (card.data()?.ownerId !== userId) fail('permission-denied', 'Este perfil não pertence à sua conta.')
        const revision = profile.data().linksRevision || 0
        if (revision !== data.revision) fail('aborted', 'Os links foram atualizados em outra aba. Recarregue antes de editar novamente.')
        tx.update(ref, { links, linksRevision: revision + 1, updatedAt: stamp() })
        return { links, revision: revision + 1 }
      })
    },
    async publicProfile(context, data) {
      await limit(context, 'public', 120)
      if (typeof data.profileId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(data.profileId)) fail('not-found', 'Perfil não encontrado.')
      return db.runTransaction(async tx => {
        const profile = await tx.get(col('Profiles').doc(data.profileId))
        if (!profile.exists) fail('not-found', 'Perfil não encontrado.')
        const card = await tx.get(col('Inventory').doc(profile.data().cardId))
        if (card.data()?.status !== 'ativado') fail('not-found', 'Este perfil está indisponível.')
        const { name, username, bio, photoUrl, website } = profile.data()
        return { profileId: profile.id, name, username, bio, photoUrl, website, ...publicContactFields(profile.data()) }
      })
    },
    async dashboard(context, data) {
      await admin(context)
      let batchesQuery = col('Batches').orderBy('createdAt', 'desc').limit(100)
      if (data.beforeBatch) {
        if (!/^[a-zA-Z0-9-]{16,64}$/.test(data.beforeBatch)) fail('invalid-argument', 'P?gina de lotes inv?lida.')
        const cursor = await col('Batches').doc(data.beforeBatch).get()
        if (!cursor.exists) fail('not-found', 'Lote n?o encontrado.')
        batchesQuery = batchesQuery.startAfter(cursor)
      }
      const batches = await batchesQuery.get()
      const counts = await Promise.all([col('Inventory').count().get(), ...['disponivel', 'ativado', 'bloqueado'].map(status => col('Inventory').where('status', '==', status).count().get())])
      let cards = []
      if (data.batchId) {
        if (!/^[a-zA-Z0-9-]{16,64}$/.test(data.batchId)) fail('invalid-argument', 'Lote inválido.')
        const snapshot = await col('Inventory').where('batchId', '==', data.batchId).get()
        cards = snapshot.docs.map(doc => { const value = serial(doc); delete value.codeEncrypted; return value }).sort((a, b) => a.number - b.number)
      }
      return { batches: batches.docs.map(serial), nextBatchCursor: batches.size === 100 ? batches.docs.at(-1).id : null, cards, counts: counts.map(s => s.data().count) }
    },
    async exportBatch(context, data) {
      const userId = await admin(context)
      await limit(context, 'export', 10)
      if (!/^[a-zA-Z0-9-]{16,64}$/.test(data.batchId || '')) fail('invalid-argument', 'Lote inválido.')
      const batch = await col('Batches').doc(data.batchId).get()
      if (batch.data()?.state !== 'ready') fail('failed-precondition', 'Aguarde a conclusão da emissão antes de exportar.')
      const snapshot = await col('Inventory').where('batchId', '==', data.batchId).get()
      await col('Audit').add({ event: 'batch_exported', userId, batchId: data.batchId, createdAt: stamp() })
      return { origin: batch.data().origin, cards: snapshot.docs.map(doc => { const value = serial(doc), code = unseal(value.codeEncrypted); delete value.codeEncrypted; return { ...value, code, url: `${batch.data().origin}/cartoes/c/${doc.id}` } }).sort((a, b) => a.number - b.number) }
    },
    async block(context, data) {
      const userId = await admin(context)
      if (!tokenPattern.test(data.token || '')) fail('invalid-argument', 'Cartão inválido.')
      await db.runTransaction(async tx => {
        const ref = col('Inventory').doc(data.token), snapshot = await tx.get(ref)
        if (!snapshot.exists) fail('not-found', 'Cartão não encontrado.')
        tx.update(ref, { status: 'bloqueado', blockedAt: stamp(), blockedBy: userId })
        audit(tx, 'blocked', userId, ref.id, snapshot.data().batchId)
      })
      return { blocked: true }
    },
  }
}
