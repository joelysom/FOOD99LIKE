// Small images fit in private Firestore documents, so card photos do not require Cloud Storage.
export async function prepareCardImage(file) {
  let bitmap
  try { bitmap = await createImageBitmap(file) }
  catch { throw new Error('Não foi possível abrir essa imagem. Escolha outro arquivo JPG, PNG ou WebP.') }
  try {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .8))
    if (!blob || blob.size > 400 * 1024) throw new Error('Escolha uma imagem menor para o perfil.')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
    return { contentType: blob.type, data: btoa(binary) }
  } finally { bitmap.close() }
}
