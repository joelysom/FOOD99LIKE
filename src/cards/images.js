// Small images fit in private Firestore documents, so card photos do not require Cloud Storage.
async function openImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { image: bitmap, close: () => bitmap.close() }
    } catch { /* Older browsers can still decode through an image element. */ }
  }
  const url = URL.createObjectURL(file)
  const image = new Image()
  try {
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url })
    return { image, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('Não foi possível abrir essa imagem. Escolha outro arquivo JPG, PNG ou WebP.')
  }
}
export async function prepareCardImage(file) {
  const source = await openImage(file)
  try {
    const canvas = document.createElement('canvas')
    let blob
    // Recompress large phone photos and PNG fallbacks within the server's fixed limit.
    for (let edge = 1024; edge >= 180; edge = Math.floor(edge * .75)) {
      const scale = Math.min(1, edge / Math.max(source.image.width, source.image.height))
      canvas.width = Math.max(1, Math.round(source.image.width * scale))
      canvas.height = Math.max(1, Math.round(source.image.height * scale))
      canvas.getContext('2d').drawImage(source.image, 0, 0, canvas.width, canvas.height)
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .8))
      if (blob && blob.size <= 400 * 1024) break
    }
    if (!blob || blob.size > 400 * 1024) throw new Error('Não foi possível preparar a imagem. Escolha outro arquivo.')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
    return { contentType: blob.type, data: btoa(binary) }
  } finally { source.close() }
}
