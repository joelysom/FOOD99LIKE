import { download } from './exports'

export const linkTypes = {
  whatsapp: { label: 'WhatsApp', category: 'Contato', hint: 'Número com código do país e DDD', placeholder: '+5581999999999', action: 'Iniciar conversa' },
  linkedin: { label: 'LinkedIn', category: 'Redes', hint: 'Endereço HTTPS do perfil', placeholder: 'https://linkedin.com/in/seu-perfil', action: 'Ver perfil profissional' },
  instagram: { label: 'Instagram', category: 'Redes', hint: 'Endereço HTTPS do perfil', placeholder: 'https://instagram.com/seu-perfil', action: 'Ver perfil no Instagram' },
  meet: { label: 'Google Meet / Agenda', category: 'Negócios', hint: 'Link da reunião ou da sua agenda', placeholder: 'https://meet.google.com/', action: 'Abrir agenda' },
  pix: { label: 'Pix', category: 'Pix', hint: 'Chave Pix pública. O visitante poderá copiá-la.', placeholder: 'E-mail, CPF/CNPJ, telefone ou chave aleatória', action: 'Toque para copiar a chave' },
  url: { label: 'Site / Link', category: 'Negócios', hint: 'Endereço completo começando com HTTPS', placeholder: 'https://seusite.com', action: 'Acessar site' },
  email: { label: 'E-mail', category: 'Contato', hint: 'Endereço de e-mail público', placeholder: 'contato@empresa.com', action: 'Enviar e-mail' },
  phone: { label: 'Telefone', category: 'Contato', hint: 'Número com DDD', placeholder: '+5581999999999', action: 'Fazer ligação' },
  pdf: { label: 'Documento PDF', category: 'Negócios', hint: 'Endereço HTTPS público do seu documento', placeholder: 'https://seusite.com/apresentacao.pdf', action: 'Abrir documento' },
}
export const destination = link => link.type === 'whatsapp' ? `https://wa.me/${link.value.replace(/\D/g, '')}`
  : link.type === 'phone' ? `tel:${link.value.replace(/[^+\d]/g, '')}`
    : link.type === 'email' ? `mailto:${link.value}` : link.value

export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  const input = document.createElement('textarea')
  input.value = text
  input.style.cssText = 'position:fixed;opacity:0;top:0'
  document.body.append(input)
  const previous = document.activeElement
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  previous?.focus()
  if (!copied) throw new Error('Não foi possível copiar. Selecione o endereço e copie manualmente.')
}
export function vcard(profile, url) {
  const escape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
  // Only explicitly public contact fields are exported, never the Auth account email.
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escape(profile.name)}`, `N:${escape(profile.name)};;;;`,
    `ORG:${escape(profile.company)}`, `TITLE:${escape(profile.role)}`, `TEL;TYPE=CELL:${escape(profile.phone)}`,
    `EMAIL:${escape(profile.contactEmail)}`, `NOTE:${escape(profile.bio)}`, `URL:${url}`, 'END:VCARD']
  download(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' }), 'contato-tokka.vcf')
}
