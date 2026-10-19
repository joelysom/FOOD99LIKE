import { HttpsError } from 'firebase-functions/v2/https'

const invalid = message => { throw new HttpsError('invalid-argument', message) }
const text = (value, max) => {
  if (typeof value !== 'string' || value.length > max) invalid('Confira o tamanho e o formato dos campos do perfil.')
  return value.trim()
}
export function httpsUrl(value) {
  const result = text(value, 2048)
  if (!result) return ''
  let url
  try { url = new URL(result) } catch { invalid('Use um endereço HTTPS válido.') }
  const localTestUpload = process.env.FUNCTIONS_EMULATOR === 'true'
    && ['127.0.0.1', 'localhost'].includes(url.hostname)
    && url.host === process.env.FIREBASE_STORAGE_EMULATOR_HOST
    && url.protocol === 'http:'
  if ((url.protocol !== 'https:' && !localTestUpload) || url.username || url.password) invalid('Use um endereço HTTPS válido.')
  return result
}
function email(value) {
  const result = text(value, 160)
  if (result && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result)) invalid('Informe um e-mail público válido.')
  return result
}
function phone(value) {
  const result = text(value, 30)
  if (result && (!/^\+?[\d\s().-]+$/.test(result) || result.replace(/\D/g, '').length < 7 || result.replace(/\D/g, '').length > 15)) invalid('Informe um telefone válido com DDD.')
  return result
}
export function contactFields(data) {
  const result = {}
  for (const field of ['role', 'company', 'location']) if (field in data) result[field] = text(data[field], 100)
  if ('phone' in data) result.phone = phone(data.phone)
  if ('contactEmail' in data) result.contactEmail = email(data.contactEmail)
  if ('companyLogoUrl' in data) result.companyLogoUrl = httpsUrl(data.companyLogoUrl)
  for (const [field, min, max] of [['photoX', 0, 100], ['photoY', 0, 100], ['photoZoom', 1, 3]]) {
    if (field in data) {
      if (!Number.isFinite(data[field]) || data[field] < min || data[field] > max) invalid('Ajuste de foto inválido.')
      result[field] = data[field]
    }
  }
  return result
}
export function contactLinks(links) {
  if (!Array.isArray(links) || links.length > 20) invalid('Adicione no máximo 20 links.')
  const ids = new Set()
  return links.map(link => {
    if (!link || typeof link !== 'object' || !/^[a-zA-Z0-9_-]{1,64}$/.test(link.id || '') || ids.has(link.id)) invalid('Identificador de link inválido ou duplicado.')
    ids.add(link.id)
    if (!['whatsapp', 'linkedin', 'instagram', 'meet', 'pix', 'url', 'email', 'phone', 'pdf'].includes(link.type) || typeof link.enabled !== 'boolean') invalid('Tipo de link inválido.')
    const title = text(link.title, 80)
    let value = text(link.value, 2048)
    if (!title || !value) invalid('Preencha o título e o destino do link.')
    if (['whatsapp', 'phone'].includes(link.type)) value = phone(value)
    else if (link.type === 'email') value = email(value)
    else if (link.type === 'pix') {
      value = text(value, 160)
      if (/[\r\n\x00-\x1f]/.test(value)) invalid('Chave Pix inválida.')
    } else value = httpsUrl(value)
    return { id: link.id, type: link.type, title, value, enabled: link.enabled }
  })
}
export function publicContactFields(profile) {
  return {
    role: profile.role || '', company: profile.company || '', location: profile.location || '',
    phone: profile.phone || '', contactEmail: profile.contactEmail || '', companyLogoUrl: profile.companyLogoUrl || '',
    photoX: profile.photoX ?? 50, photoY: profile.photoY ?? 50, photoZoom: profile.photoZoom ?? 1,
    links: (profile.links || []).filter(link => link.enabled === true),
  }
}
