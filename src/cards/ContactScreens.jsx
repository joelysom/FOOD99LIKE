import { useEffect, useId, useRef, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import QRCode from 'qrcode'
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, Camera, Copy, Crop, Download, Eye, FileText, Globe, GripVertical, Mail, MapPin, Phone, PlusCircle, QrCode, Share2, Smartphone, Trash2, UserPlus, UserRound, X } from 'lucide-react'
import { cardsApi, cardsStorage, cardsUseFunctions, friendlyError } from './api'
import { prepareCardImage } from './images'
import { destination, copyText, linkTypes, vcard } from './contact'
import { download } from './exports'
import logo from './assets/tokka-contact.png'
import whatsapp from './assets/icons/whatsapp.svg?raw'
import linkedin from './assets/icons/linkedin.svg?raw'
import meet from './assets/icons/googlemeet.svg?raw'
import pix from './assets/icons/pix.svg?raw'
import instagram from './assets/icons/instagram.svg?raw'

const serviceImages = { whatsapp, linkedin, meet, pix, instagram }
const plainIcons = { email: Mail, phone: Phone, pdf: FileText, url: Globe }
function ServiceIcon({ type }) {
  const Icon = plainIcons[type] || Globe
  // Markup comes only from the bundled, inspected SVG assets, never from profile data.
  return <span className="ct-service" data-service={type} aria-hidden="true">{serviceImages[type] ? <span dangerouslySetInnerHTML={{ __html: serviceImages[type] }} /> : <Icon size={23} />}</span>
}
function Field({ label, ...props }) { return <label className="tc-field"><span>{label}</span><input {...props} /></label> }
function Notice({ children, success = false }) { return <div className={`tc-notice ${success ? 'tc-success' : ''}`} role={success ? 'status' : 'alert'}>{children}</div> }
function Dialog({ title, onClose, children }) {
  const dialog = useRef(null)
  const id = useId()
  useEffect(() => { dialog.current.showModal() }, [])
  return <dialog ref={dialog} className="ct-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="ct-section-heading"><h2 id={id}>{title}</h2><button className="ct-icon-button" type="button" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>{children}
  </dialog>
}
function useImage(file, fallback) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!file) return
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return file ? url : fallback
}
function Avatar({ profile, large = false }) {
  return <span className={`ct-avatar ${large ? 'ct-avatar-large' : ''}`}>
    {profile.photoUrl ? <img key={profile.photoUrl} src={profile.photoUrl} alt={`Foto de ${profile.name || 'perfil'}`} referrerPolicy="no-referrer" style={{ objectPosition: `${profile.photoX ?? 50}% ${profile.photoY ?? 50}%`, transform: `scale(${profile.photoZoom ?? 1})` }} onError={event => { event.currentTarget.style.visibility = 'hidden' }} /> : <UserRound size={large ? 40 : 28} />}
  </span>
}
export function PublicContactCard({ profile, run, onMessage }) {
  const url = `${window.location.origin}/cartoes/p/${profile.profileId}`
  const links = [...(profile.links || [])]
  if (profile.website && !links.some(link => link.value === profile.website)) links.push({ id: 'website', type: 'url', title: 'Vamos nos conectar', value: profile.website, enabled: true })
  return <div className="ct-public-stack">
    <section className="ct-public-hero">
      <Avatar profile={profile} large /><h1>{profile.name || 'Uma nova conexão TOKKA'}</h1>
      {profile.role && <p className="ct-public-role">{profile.role}</p>}
      {profile.username && <p className="ct-public-handle">@{profile.username}</p>}
      {profile.bio && <p className="ct-public-bio">{profile.bio}</p>}
      {(profile.companyLogoUrl || profile.company) && <div className="ct-public-company">{profile.companyLogoUrl ? <img src={profile.companyLogoUrl} alt={`Logo de ${profile.company || 'sua empresa'}`} referrerPolicy="no-referrer" /> : <span>{profile.company}</span>}</div>}
      {profile.location && <span className="ct-location"><MapPin size={14} />{profile.location}</span>}
      <div className="ct-public-main-actions"><button className="tc-primary" onClick={() => { vcard(profile, url); onMessage('Contato baixado. Abra o arquivo para adicionar à agenda.') }}><UserPlus size={19} />Salvar contato</button>{profile.phone && <a href={destination({ type: 'phone', value: profile.phone })} className="ct-call"><Phone size={19} />Ligar</a>}</div>
    </section>
    <section><div className="ct-section-heading"><h2>Vamos nos conectar</h2></div><div className="ct-public-links">
      {profile.contactEmail && <a className="ct-public-link" href={`mailto:${profile.contactEmail}`}><ServiceIcon type="email" /><span><strong>E-mail</strong><small>{profile.contactEmail}</small></span><ArrowUpRight size={20} /></a>}
      {links.map(link => {
        const content = <><ServiceIcon type={link.type} /><span><strong>{link.title}</strong><small>{linkTypes[link.type]?.action}</small></span>{link.type === 'pix' ? <Copy size={20} /> : <ArrowUpRight size={20} />}</>
        return link.type === 'pix' ? <button key={link.id} className="ct-public-link" onClick={() => run(async () => { await copyText(link.value); onMessage('Chave Pix copiada!') })}>{content}</button> : <a key={link.id} className="ct-public-link" href={destination(link)} target={['phone', 'email'].includes(link.type) ? undefined : '_blank'} rel="noopener noreferrer">{content}</a>
      })}
      {!links.length && !profile.contactEmail && <p className="ct-empty">Nenhum link publicado no momento.</p>}
    </div></section><footer className="ct-public-footer">Feito com<img src={logo} alt="TOKKA" width="2172" height="724" /></footer>
  </div>
}

function LinkDialog({ link, busy, onSave, onClose }) {
  const [form, setForm] = useState(link || { id: crypto.randomUUID(), type: 'url', title: '', value: '', enabled: true })
  const [error, setError] = useState('')
  const info = linkTypes[form.type]
  return <Dialog title={link ? 'Editar link' : 'Adicionar link'} onClose={onClose}><form onSubmit={async event => {
    event.preventDefault(); setError('')
    try { await onSave(form) } catch (error) { setError(friendlyError(error)) }
  }}>
    <label className="tc-field"><span>Tipo de ação</span><select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>{Object.entries(linkTypes).map(([type, info]) => <option key={type} value={type}>{info.label}</option>)}</select></label>
    <Field label="Título do botão" required maxLength={80} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
    <Field label={form.type === 'pix' ? 'Chave Pix' : 'Destino'} type={['url', 'linkedin', 'instagram', 'meet', 'pdf'].includes(form.type) ? 'url' : form.type === 'email' ? 'email' : ['phone', 'whatsapp'].includes(form.type) ? 'tel' : 'text'} placeholder={info.placeholder} required maxLength={2048} value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} />
    <p>{info.hint}</p><label className="ct-checkbox"><input type="checkbox" checked={form.enabled} onChange={event => setForm({ ...form, enabled: event.target.checked })} />Exibir no perfil</label>
    {error && <Notice>{error}</Notice>}<div className="ct-dialog-actions"><button type="button" className="tc-secondary" onClick={onClose} disabled={busy}>Cancelar</button><button className="tc-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar link'}</button></div>
  </form></Dialog>
}

export function ContactAccount({ user, session, refresh, run, busy }) {
  const profile = session.profile
  const [form, setForm] = useState(() => ({ name: profile?.name || '', username: profile?.username || '', bio: profile?.bio || '', photoUrl: profile?.photoUrl || '', website: profile?.website || '', role: profile?.role || '', company: profile?.company || '', phone: profile?.phone || '', contactEmail: profile?.contactEmail || '', location: profile?.location || '', companyLogoUrl: profile?.companyLogoUrl || '', photoX: profile?.photoX ?? 50, photoY: profile?.photoY ?? 50, photoZoom: profile?.photoZoom ?? 1 }))
  const [photoFile, setPhotoFile] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const photoUrl = useImage(photoFile, form.photoUrl)
  const companyLogo = useImage(logoFile, form.companyLogoUrl)
  const photoInput = useRef(null), logoInput = useRef(null)
  const [links, setLinks] = useState(profile?.links || [])
  const [revision, setRevision] = useState(profile?.linksRevision || 0)
  const [filter, setFilter] = useState('Todos')
  const [modal, setModal] = useState(null)
  const [message, setMessage] = useState('')
  const [imageError, setImageError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  const mutation = useRef(false)
  const [dragged, setDragged] = useState(null)
  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  if (!profile) return <section className="tc-panel"><h2>Seu cartão está esperando.</h2><p>Ative um cartão TOKKA para criar seu perfil.</p><a className="tc-primary" href="/cartoes/cadastro">Ativar cartão</a></section>
  const url = `${window.location.origin}/cartoes/p/${user.uid}`
  const cardUrl = `${window.location.origin}/cartoes/c/${profile.cardId}`
  const change = field => event => { setDirty(true); setMessage(''); setForm({ ...form, [field]: field === 'username' ? event.target.value.toLowerCase() : event.target.value }) }
  function chooseImage(event, kind) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setImageError('Escolha uma imagem JPG, PNG ou WebP de até 2 MB.'); return }
    setImageError(''); setDirty(true)
    if (kind === 'photo') { setPhotoFile(file); setForm({ ...form, photoX: 50, photoY: 50, photoZoom: 1 }) } else setLogoFile(file)
  }
  async function saveLinks(next) {
    if (mutation.current) throw new Error('Aguarde a alteração anterior terminar.')
    const previous = links
    mutation.current = true; setLinkBusy(true)
    setLinks(next)
    try {
      const result = await cardsApi('saveLinks', { links: next, revision })
      setLinks(result.links); setRevision(result.revision); setMessage('Links publicados com sucesso.')
    } catch (error) {
      setLinks(previous)
      throw error
    } finally { mutation.current = false; setLinkBusy(false) }
  }
  async function move(id, position) {
    const next = [...links], index = next.findIndex(link => link.id === id)
    if (index < 0 || position < 0 || position >= next.length) return
    next.splice(position, 0, next.splice(index, 1)[0]); await saveLinks(next)
  }
  async function upload(file, name, current) {
    if (!file) return current
    if (!cardsUseFunctions) return (await cardsApi('uploadImage', { kind: name, ...await prepareCardImage(file) })).url
    const object = ref(cardsStorage, `cards/profiles/${user.uid}/${name}`)
    await uploadBytes(object, file, { contentType: file.type, cacheControl: 'public,max-age=300' })
    return getDownloadURL(object)
  }
  const displayedLinks = links.filter(link => filter === 'Todos' || linkTypes[link.type]?.category === filter)
  return <>
    <div className="ct-editor-grid">
      <section className="tc-panel ct-profile-editor"><div className="ct-section-heading"><h2>Editar perfil</h2><a className="tc-text" href="/cartoes/simulacao"><Smartphone size={17} />Simular</a></div>
        <form onSubmit={event => { event.preventDefault(); run(async () => {
          const [photo, companyLogoUrl] = await Promise.all([upload(photoFile, 'avatar', form.photoUrl), upload(logoFile, 'company-logo', form.companyLogoUrl)])
          const next = { ...form, photoUrl: photo, companyLogoUrl }
          await cardsApi('saveProfile', next); setForm(next); setPhotoFile(null); setLogoFile(null); setDirty(false); await refresh(); setMessage('Seu perfil foi salvo.')
        }) }}>
          <div className="ct-photo-editor"><Avatar profile={{ ...form, photoUrl }} /><div><strong>Sua foto</strong><p>JPG, PNG ou WebP · até 2 MB</p><div className="ct-inline-actions"><button type="button" onClick={() => photoInput.current.click()}><Camera size={15} />Trocar</button><button type="button" disabled={!photoUrl} onClick={() => setModal({ type: 'crop', x: form.photoX, y: form.photoY, zoom: form.photoZoom })}><Crop size={15} />Ajustar</button><button type="button" disabled={!photoUrl} onClick={() => { setPhotoFile(null); setForm({ ...form, photoUrl: '' }); setDirty(true) }}>Remover</button></div></div></div>
          <input className="ct-file-input" ref={photoInput} type="file" aria-label="Foto de perfil" accept="image/jpeg,image/png,image/webp" onClick={event => { event.currentTarget.value = '' }} onChange={event => chooseImage(event, 'photo')} />
          {imageError && <Notice>{imageError}</Notice>}
          <Field label="Nome completo" autoComplete="name" required maxLength={80} value={form.name} onChange={change('name')} />
          <div className="ct-field-grid"><Field label="Cargo / Função" maxLength={100} value={form.role} onChange={change('role')} /><Field label="Empresa" maxLength={100} value={form.company} onChange={change('company')} /></div>
          <label className="tc-field"><span>Biografia <small>{form.bio.length}/600</small></span><textarea rows={3} maxLength={600} value={form.bio} onChange={change('bio')} /></label>
          <div className="ct-field-grid"><Field label="Telefone com DDD" type="tel" maxLength={30} value={form.phone} onChange={change('phone')} /><Field label="E-mail público" type="email" maxLength={160} value={form.contactEmail} onChange={change('contactEmail')} /></div>
          <p className="ct-help">Preencha somente os contatos que deseja publicar. O e-mail de acesso à conta permanece privado.</p>
          <Field label="Cidade / Localização" maxLength={100} value={form.location} onChange={change('location')} />
          <Field label="Nome de usuário exclusivo" required minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" value={form.username} onChange={change('username')} />
          <Field label="Site ou rede social (HTTPS)" type="url" maxLength={2048} value={form.website} onChange={change('website')} />
          <div className="ct-company-editor"><div className="ct-section-heading"><h3>Logo da empresa</h3><span>Opcional</span></div><div className="ct-company-preview">{companyLogo ? <img src={companyLogo} alt="Prévia da logo da empresa" /> : <span>Sua logo aqui</span>}</div><div className="ct-inline-actions"><button type="button" onClick={() => logoInput.current.click()}><Camera size={16} />Adicionar / trocar</button><button type="button" disabled={!companyLogo} onClick={() => { setLogoFile(null); setForm({ ...form, companyLogoUrl: '' }); setDirty(true) }}><Trash2 size={15} />Remover</button></div><p className="ct-help">PNG, JPG ou WebP até 2 MB. A logo aparece inteira abaixo do cargo no perfil público.</p><input ref={logoInput} className="ct-file-input" type="file" aria-label="Logo da empresa" accept="image/jpeg,image/png,image/webp" onClick={event => { event.currentTarget.value = '' }} onChange={event => chooseImage(event, 'logo')} /></div>
          <details className="ct-image-urls"><summary>Usar um endereço de imagem</summary><Field label="Link HTTPS para a foto" type="url" maxLength={2048} value={form.photoUrl} onChange={change('photoUrl')} /><Field label="Link HTTPS para a logo" type="url" maxLength={2048} value={form.companyLogoUrl} onChange={change('companyLogoUrl')} /></details>
          <div className="ct-save-row"><span role="status">{dirty ? 'Alterações não salvas' : 'Dados salvos no servidor'}</span><button className="tc-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</button></div>
        </form>
      </section>
      <section className="ct-links-editor"><div className="ct-section-heading"><h2>Seus links</h2><span>{links.filter(link => link.enabled).length} ativos</span></div><button className="ct-add-link" disabled={busy || linkBusy || links.length >= 20} onClick={() => setModal({ type: 'link' })}><PlusCircle size={19} />Adicionar link ou ação</button>
        <div className="ct-filters" role="group" aria-label="Filtrar links">{['Todos', 'Contato', 'Redes', 'Negócios', 'Pix'].map(category => <button key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}{category === 'Todos' ? ` (${links.length})` : ''}</button>)}</div><p className="ct-help">Arraste pela alça ou use as setas para mudar a ordem. As alterações nos links são publicadas na hora.</p>
        <div className="ct-managed-links">{displayedLinks.map(link => {
          const index = links.findIndex(entry => entry.id === link.id)
          return <article className="ct-managed-link" key={link.id} data-enabled={link.enabled} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain') || dragged; setDragged(null); if (id) run(() => move(id, index)) }}>
            <div className="ct-link-top"><button type="button" className="ct-drag-handle" draggable={!busy && !linkBusy} aria-label={`Arrastar ${link.title}`} onDragStart={event => { event.dataTransfer.setData('text/plain', link.id); setDragged(link.id) }} onDragEnd={() => setDragged(null)}><GripVertical size={19} /></button><span className="ct-service-tile"><ServiceIcon type={link.type} /></span><div className="ct-link-description"><strong>{link.title}</strong><small>{link.value}</small></div><label className="ct-switch"><input type="checkbox" role="switch" aria-label={`Exibir ${link.title} no perfil`} checked={link.enabled} disabled={busy || linkBusy} onChange={event => { const enabled = event.target.checked; run(() => saveLinks(links.map(entry => entry.id === link.id ? { ...entry, enabled } : entry))) }} /><span aria-hidden="true" /></label></div>
            <div className="ct-link-controls"><div className="ct-inline-actions"><button type="button" className="ct-icon-button" aria-label={`Subir ${link.title}`} disabled={index === 0 || busy || linkBusy} onClick={() => run(() => move(link.id, index - 1))}><ArrowUp size={16} /></button><button type="button" className="ct-icon-button" aria-label={`Descer ${link.title}`} disabled={index === links.length - 1 || busy || linkBusy} onClick={() => run(() => move(link.id, index + 1))}><ArrowDown size={16} /></button><span>{index + 1}</span></div><div className="ct-inline-actions"><button disabled={busy || linkBusy} onClick={() => setModal({ type: 'link', link })}>Editar</button><button className="ct-icon-button ct-danger" aria-label={`Excluir ${link.title}`} disabled={busy || linkBusy} onClick={() => setModal({ type: 'delete', link })}><Trash2 size={16} /></button></div></div>
          </article>
        })}{!displayedLinks.length && <p className="ct-empty">Nenhum link aqui. Adicione seu primeiro link acima.</p>}</div>
      </section>
      <section className="tc-panel ct-share-panel"><div className="ct-section-heading"><h2>Compartilhe seu cartão</h2></div><p>Seu QR Code abre o perfil com os dados atualizados.</p><div className="ct-sharing-actions">
        <button className="tc-secondary" onClick={() => run(async () => { if (navigator.share) { try { await navigator.share({ title: `${form.name} · TOKKA Contact`, url }); return } catch (error) { if (error.name === 'AbortError') return } } await copyText(url); setMessage('Link do perfil copiado!') })}><Share2 size={17} />Compartilhar</button>
        <button className="tc-secondary" onClick={() => run(async () => { await copyText(url); setMessage('Link do perfil copiado!') })}><Copy size={17} />Copiar link</button>
        <button className="tc-secondary" onClick={() => setModal({ type: 'qr' })}><QrCode size={17} />Ver QR Code</button>
        <button className="tc-secondary" onClick={() => run(async () => { const svg = await QRCode.toString(cardUrl, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' }); download(new Blob([svg], { type: 'image/svg+xml' }), 'tokka-perfil.svg') })}><Download size={17} />Baixar QR</button>
      </div><a className="tc-text" href={url}><Eye size={16} />Ver meu perfil público</a><span className="ct-profile-url">{url}</span></section>
    </div>
    {message && <div className="ct-feedback" role="status">{message}<button className="ct-icon-button" aria-label="Fechar aviso" onClick={() => setMessage('')}><X size={16} /></button></div>}
    {modal?.type === 'link' && <LinkDialog link={modal.link} busy={busy || linkBusy} onClose={() => setModal(null)} onSave={async link => { await saveLinks(modal.link ? links.map(entry => entry.id === link.id ? link : entry) : [...links, link]); setModal(null) }} />}
    {modal?.type === 'delete' && <Dialog title="Excluir link" onClose={() => setModal(null)}><p>Excluir “{modal.link.title}” do perfil?</p><div className="ct-dialog-actions"><button className="tc-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="tc-danger" disabled={linkBusy} onClick={() => run(async () => { await saveLinks(links.filter(link => link.id !== modal.link.id)); setModal(null) })}>Excluir</button></div></Dialog>}
    {modal?.type === 'crop' && <Dialog title="Ajustar foto" onClose={() => setModal(null)}><div className="ct-crop-preview"><Avatar profile={{ ...form, photoUrl, photoX: modal.x, photoY: modal.y, photoZoom: modal.zoom }} large /></div>{[['zoom', 'Zoom', 1, 3, .05], ['x', 'Posição horizontal', 0, 100, 1], ['y', 'Posição vertical', 0, 100, 1]].map(([key, label, min, max, step]) => <Field key={key} label={label} type="range" min={min} max={max} step={step} value={modal[key]} onChange={event => setModal({ ...modal, [key]: Number(event.target.value) })} />)}<p>Depois, salve o perfil para publicar o ajuste.</p><button className="tc-primary" onClick={() => { setForm({ ...form, photoX: modal.x, photoY: modal.y, photoZoom: modal.zoom }); setDirty(true); setModal(null) }}>Aplicar ajuste</button></Dialog>}
    {modal?.type === 'qr' && <Dialog title="QR Code do seu cartão" onClose={() => setModal(null)}><ContactQR value={cardUrl} /><p className="ct-profile-url">{cardUrl}</p><p>O endereço impresso permanece o mesmo quando você atualiza seu perfil.</p></Dialog>}
  </>
}

function ContactQR({ value }) {
  const [url, setUrl] = useState('')
  useEffect(() => { let alive = true; QRCode.toDataURL(value, { width: 280, margin: 4 }).then(value => { if (alive) setUrl(value) }); return () => { alive = false } }, [value])
  return url ? <img className="ct-qr-preview" src={url} alt="QR Code do seu cartão TOKKA" /> : <p role="status">Preparando QR Code…</p>
}
export function ContactPublic({ profileId, run }) {
  const [state, setState] = useState({ loading: true })
  const [message, setMessage] = useState('')
  useEffect(() => { let alive = true; cardsApi('publicProfile', { profileId }).then(profile => { if (alive) setState({ profile }) }).catch(error => { if (alive) setState({ error: friendlyError(error) }) }); return () => { alive = false } }, [profileId])
  if (state.loading) return <section className="ct-empty" role="status">Carregando seu cartão…</section>
  if (state.error) return <section className="tc-panel"><Notice>{state.error}</Notice><button className="tc-secondary" onClick={() => window.location.reload()}>Tentar novamente</button></section>
  return <><PublicContactCard profile={state.profile} run={run} onMessage={setMessage} />{message && <div className="ct-feedback" role="status">{message}<button className="ct-icon-button" aria-label="Fechar aviso" onClick={() => setMessage('')}><X size={16} /></button></div>}</>
}
export function ContactSimulation({ user, session }) {
  if (!session.profile) return <section className="tc-panel"><p>Ative seu cartão para visualizar seu perfil.</p><a href="/cartoes/cadastro" className="tc-primary">Ativar cartão</a></section>
  return <section className="ct-simulation"><div className="ct-section-heading"><a className="ct-icon-button" href="/cartoes/conta" aria-label="Voltar ao editor"><ArrowLeft size={20} /></a><div><h1>Simulação do cartão</h1><p>Veja o perfil com os dados publicados.</p></div></div><div className="ct-phone"><div className="ct-phone-status">TOKKA Contact <span>● ● ●</span></div><iframe title="Simulação do perfil público" src={`/cartoes/p/${user.uid}`} /></div><a className="tc-primary" href={`/cartoes/p/${user.uid}`}>Abrir perfil público<ArrowUpRight size={17} /></a></section>
}
