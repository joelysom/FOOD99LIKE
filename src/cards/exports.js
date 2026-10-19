import QRCode from 'qrcode'
import JSZip from 'jszip'
export function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const csvCell = value => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`
export function exportCsv(batchId, cards) {
  const rows = [['numero', 'id', 'lote', 'codigo_ativacao', 'status', 'usuario_id', 'emissao', 'ativacao', 'url'], ...cards.map(c => [c.number, c.id, c.batchId, c.code, c.status, c.ownerId, c.createdAt, c.activatedAt, c.url])]
  download(new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), `tokka-${batchId}.csv`)
}
export async function exportPrintKit(batchId, cards, origin) {
  const zip = new JSZip()
  const rendered = []
  for (const card of cards) {
    const svg = await QRCode.toString(card.url, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 240 })
    zip.file(`qr/${String(card.number).padStart(4, '0')}-${card.id}.svg`, svg)
    rendered.push(`<article><div class="brand">TOKKA <small>CONEXÕES QUE FICAM.</small></div><div class="content">${svg}<div><strong>Seu próximo encontro<br>começa aqui.</strong><p>Ative em<br>${escape(origin)}/cartoes/cadastro</p><b>${escape(card.code)}</b><p>Cartão ${card.number} · ${escape(batchId.slice(0, 8))}</p></div></div></article>`)
  }
  const leaflet = await QRCode.toString(`${origin}/cartoes/cadastro`, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' })
  zip.file('folheto-cadastro.svg', leaflet)
  zip.file('LEIA-ME.txt', 'Abra imprimir.html e use Imprimir > Salvar como PDF, escala 100%, papel A4. Os cartões medem 85,6 x 54 mm, sem sangria. Valide leitura dos QRs e prova com a gráfica antes da tiragem. O código e o QR de um cartão disponível permitem ativá-lo: restrinja acesso a este kit. Não publique os arquivos. O folheto-cadastro.svg é o QR geral reutilizável.')
  zip.file('imprimir.html', `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>TOKKA · Lote ${escape(batchId)}</title><style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;display:grid;grid-template-columns:repeat(2,85.6mm);gap:5mm;justify-content:center}article{width:85.6mm;height:54mm;border:1px solid #bbcbd1;padding:5mm;break-inside:avoid;color:#073949}.brand{font-size:20px;font-weight:900;letter-spacing:3px}.brand small{font-size:7px;letter-spacing:1px;margin-left:5px}.content{display:flex;align-items:center;gap:3mm}.content svg{width:30mm;height:30mm;flex-shrink:0}strong{font-size:12px}p{font-size:8px;overflow-wrap:anywhere}b{font:9px monospace}@media screen{body{padding:20px;background:#eee}article{background:white}}</style>${rendered.join('')}</html>`)
  download(await zip.generateAsync({ type: 'blob' }), `tokka-impressao-${batchId}.zip`)
}
export async function downloadLeaflet(origin) {
  const svg = await QRCode.toString(`${origin}/cartoes/cadastro`, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' })
  download(new Blob([svg], { type: 'image/svg+xml' }), 'tokka-folheto-cadastro.svg')
}
