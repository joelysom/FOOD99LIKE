import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ArrowRight, Check, CreditCard, Download, LogOut, QrCode, ShieldCheck } from 'lucide-react'
import { cardsApi, cardsAuth, friendlyError } from './api'
import { downloadLeaflet, exportCsv, exportPrintKit } from './exports'
import { getCardsRoute } from './routes'
import { ContactAccount, ContactPublic, ContactSimulation } from './ContactScreens'
import contactLogo from './assets/tokka-contact.png'
import './cards.css'

const route = getCardsRoute(window.location.pathname)
const date = value => value ? new Date(value).toLocaleString('pt-BR') : '—'
function Field({ label, ...props }) { return <label className="tc-field"><span>{label}</span><input {...props} /></label> }
function Notice({ children, success = false }) { return <div className={`tc-notice ${success ? 'tc-success' : ''}`} role={success ? 'status' : 'alert'}>{children}</div> }
function AuthForm({ run, busy, admin = false }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  return <section className="tc-panel"><div className="tc-eyebrow"><ShieldCheck size={16} /> ACESSO SEGURO</div><h2>{admin ? 'Equipe TOKKA' : mode === 'register' ? 'Crie sua conta.' : 'Bom ter você aqui.'}</h2><p>{admin ? 'Entre com uma conta autorizada a gerenciar cartões.' : 'Sua conta guarda seu cartão e permite atualizar o perfil quando quiser.'}</p>
    {!admin && <div className="tc-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Já tenho conta</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Criar conta</button></div>}
    <form onSubmit={event => { event.preventDefault(); run(async () => {
      if (mode === 'register' && password !== confirm) throw new Error('As senhas precisam ser iguais.')
      if (mode === 'register' && password.length < 8) throw new Error('Escolha uma senha com pelo menos 8 caracteres.')
      await (mode === 'register' ? createUserWithEmailAndPassword : signInWithEmailAndPassword)(cardsAuth, email.trim(), password)
    }) }}>
      <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <Field label="Senha" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} />
      {mode === 'register' && <Field label="Confirme sua senha" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />}
      <button className="tc-primary" disabled={busy}>{busy ? 'Aguarde…' : mode === 'register' ? 'Criar conta' : 'Entrar'}<ArrowRight size={18} /></button>
    </form>
    {mode === 'login' && <button className="tc-text" disabled={busy} onClick={() => run(async () => { if (!email.trim()) throw new Error('Preencha seu e-mail primeiro.'); await sendPasswordResetEmail(cardsAuth, email.trim(), { url: `${window.location.origin}/cartoes/conta` }); setMessage('Se houver uma conta para este e-mail, você receberá as instruções de recuperação.') })}>Esqueci minha senha</button>}
    {message && <Notice success>{message}</Notice>}
  </section>
}
function Activation({ user, session, run, busy }) {
  const [code, setCode] = useState('')
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState(false)
  const token = route.token || sessionStorage.getItem('tokka-selected-card')
  useEffect(() => {
    let alive = true
    const request = token ? cardsApi('resolve', { token }) : Promise.resolve(null)
    request.then(value => { if (alive) { setCard(value); setLoading(false); if (value?.status === 'ativado' && route.token) window.location.replace(`/cartoes/p/${value.profileId}`) } }).catch(error => { if (alive) { setLoadError(friendlyError(error)); setLoading(false) } })
    return () => { alive = false }
  }, [token])
  if (loading) return <section className="tc-panel" role="status">Localizando seu cartão…</section>
  if (success) return <section className="tc-panel tc-centered"><span className="tc-icon"><Check /></span><h2>Cartão ativado com sucesso!</h2><p>Seu cartão já está vinculado à sua conta. Agora, dê sua identidade a ele.</p><a className="tc-primary" href="/cartoes/conta">Completar meu perfil <ArrowRight size={18} /></a></section>
  return <>
    <section className="tc-panel"><div className="tc-eyebrow">01 / SEU CARTÃO</div><h2>Uma conexão.<br />Infinitas possibilidades.</h2><p>{route.token ? 'Reconhecemos o cartão pelo QR Code. Continue abaixo para ativar.' : 'Digite o código que veio com seu cartão TOKKA para começar.'}</p>
      {loadError && <Notice>{loadError}<button className="tc-text" onClick={() => window.location.reload()}>Tentar novamente</button></Notice>}
      {!route.token && <form onSubmit={e => { e.preventDefault(); run(async () => { const found = await cardsApi('resolve', { code }); setCard(found); setLoadError(''); sessionStorage.setItem('tokka-selected-card', found.token) }) }}><Field label="Código de ativação" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autoCapitalize="characters" autoComplete="off" maxLength={40} required value={code} onChange={e => setCode(e.target.value)} /><button className="tc-primary" disabled={busy}>Encontrar meu cartão <ArrowRight size={18} /></button></form>}
      {card && <Notice success={card.status === 'disponivel'}>{card.status === 'disponivel' ? 'Cartão encontrado e disponível para ativação.' : card.status === 'ativado' ? 'Este cartão já foi ativado.' : 'Este cartão está bloqueado. Fale com a equipe TOKKA.'}</Notice>}
      {card?.status === 'ativado' && <a className="tc-text" href={`/cartoes/p/${card.profileId}`}>Ver perfil público →</a>}
    </section>
    {card?.status === 'disponivel' && (!user ? <AuthForm run={run} busy={busy} /> : <section className="tc-panel"><div className="tc-eyebrow">03 / ATIVAÇÃO</div><h2>Pronto para ser seu.</h2><p>Você está conectado como <strong>{user.email}</strong>. Ao ativar, este cartão será vinculado à sua conta.</p>{session?.profile && session.profile.cardId !== card.token ? <Notice>Sua conta já possui um cartão. <a href="/cartoes/conta">Acessar meu perfil</a></Notice> : <button className="tc-primary" disabled={busy} onClick={() => run(async () => { await cardsApi('activate', { token: card.token }); sessionStorage.removeItem('tokka-selected-card'); setSuccess(true) })}>{busy ? 'Ativando…' : 'Ativar meu cartão'}<Check size={18} /></button>}</section>)}
  </>
}
function Admin({ run, busy }) {
  const [data, setData] = useState(null)
  const [initialError, setInitialError] = useState('')
  const [batchId, setBatchId] = useState('')
  const [quantity, setQuantity] = useState(300)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const [confirmBlock, setConfirmBlock] = useState('')
  const [pending, setPending] = useState(() => { try { return JSON.parse(sessionStorage.getItem(`tokka-pending-batch-${cardsAuth.currentUser.uid}`)) } catch { return null } })
  async function load(id = batchId) { const result = await cardsApi('dashboard', { batchId: id }); setData(result); setBatchId(id); setInitialError('') }
  useEffect(() => { let alive = true; cardsApi('dashboard').then(value => { if (alive) setData(value) }).catch(error => { if (alive) setInitialError(friendlyError(error)) }); return () => { alive = false } }, [])
  const generate = request => run(async () => {
    const job = request || { quantity: Number(quantity), requestId: crypto.randomUUID() }
    setPending(job); sessionStorage.setItem(`tokka-pending-batch-${cardsAuth.currentUser.uid}`, JSON.stringify(job))
    const result = await cardsApi('generate', job)
    sessionStorage.removeItem(`tokka-pending-batch-${cardsAuth.currentUser.uid}`); setPending(null)
    await load(result.batchId); setMessage(`${result.quantity} cartões criados e salvos com sucesso.`)
  })
  const exportBatch = type => run(async () => {
    const kit = await cardsApi('exportBatch', { batchId })
    if (type === 'csv') exportCsv(batchId, kit.cards)
    else await exportPrintKit(batchId, kit.cards, kit.origin)
    setMessage('Exportação concluída. Guarde os arquivos com acesso restrito: eles permitem ativar cartões disponíveis.')
  })
  if (initialError) return <section className="tc-panel"><Notice>{initialError}</Notice><button className="tc-secondary" onClick={() => run(() => load())}>Tentar novamente</button></section>
  if (!data) return <section className="tc-panel" role="status">Carregando emissões…</section>
  const cards = data.cards.filter(c => (!status || c.status === status) && `${c.id} ${c.number} ${c.ownerId || ''}`.toLowerCase().includes(search.toLowerCase()))
  const selected = data.batches.find(b => b.id === batchId)
  return <div className="tc-admin"><div className="tc-title-row"><div><div className="tc-eyebrow">OPERAÇÃO TOKKA</div><h1>Conexões começam aqui.</h1><p>Emita, distribua e acompanhe cada cartão.</p></div><button className="tc-secondary" disabled={busy} onClick={() => run(() => load())}>Atualizar painel</button></div>
    <div className="tc-stats">{['Total de cartões', 'Disponíveis', 'Ativados', 'Bloqueados'].map((label, i) => <div key={label}><span>{label}</span><strong>{data.counts[i]}</strong></div>)}</div>
    {message && <Notice success>{message}</Notice>}
    <div className="tc-admin-grid"><section className="tc-panel"><div className="tc-eyebrow"><CreditCard size={16} /> NOVA EMISSÃO</div><h2>Prepare o próximo encontro.</h2><p>Cartões virgens, sem contas fictícias. Cada unidade tem um QR exclusivo.</p><form onSubmit={e => { e.preventDefault(); generate() }}><Field label="Quantidade de cartões" type="number" min={1} max={1000} required value={quantity} onChange={e => setQuantity(e.target.value)} /><button className="tc-primary" disabled={busy || !!pending}>{busy ? 'Processando…' : 'Gerar lote de cartões'}<ArrowRight size={18} /></button></form>{pending && <Notice>Há uma emissão pendente de {pending.quantity} cartões.<button className="tc-secondary" disabled={busy} onClick={() => generate(pending)}>Retomar emissão</button></Notice>}</section>
    <section className="tc-panel"><div className="tc-eyebrow"><QrCode size={16} /> MATERIAIS</div><h2>Do digital para as mãos.</h2><p>Selecione um lote para exportar códigos, QR Codes vetoriais e cartões em tamanho de impressão.</p><label className="tc-field"><span>Histórico de lotes</span><select value={batchId} disabled={busy} onChange={e => { const id = e.target.value; run(() => load(id)) }}><option value="">Selecione um lote</option>{data.batches.map(b => <option key={b.id} value={b.id}>{date(b.createdAt)} · {b.quantity} cartões · {b.state === 'ready' ? 'concluído' : `${b.generated} emitidos`}</option>)}</select></label>
      {data.nextBatchCursor && <button className="tc-text" disabled={busy} onClick={() => run(async () => { const more = await cardsApi('dashboard', { beforeBatch: data.nextBatchCursor }); setData({ ...data, batches: [...data.batches, ...more.batches], nextBatchCursor: more.nextBatchCursor }) })}>Carregar lotes anteriores ?</button>}
      {selected && <p className="tc-break">Lote: {batchId}<br />Responsável: {selected.createdBy}</p>}
      <div className="tc-actions"><button className="tc-secondary" disabled={busy || selected?.state !== 'ready'} onClick={() => exportBatch('csv')}><Download size={16} /> Planilha CSV</button><button className="tc-secondary" disabled={busy || selected?.state !== 'ready'} onClick={() => exportBatch('print')}><Download size={16} /> Kit de impressão e QRs</button></div>
      {selected?.state === 'generating' && <button className="tc-secondary" disabled={busy} onClick={() => generate({ requestId: selected.id, quantity: selected.quantity })}>Retomar este lote</button>}
      <p>O kit contém SVGs e uma folha vetorial para salvar como PDF pelo navegador.</p><button className="tc-text" disabled={busy} onClick={() => run(async () => { const kit = await cardsApi('exportBatch', { batchId }); await downloadLeaflet(kit.origin) })} hidden={selected?.state !== 'ready'}>Baixar QR geral do folheto →</button>
    </section></div>
    <section className="tc-panel"><div className="tc-title-row"><h2>Cartões do lote</h2><span>{cards.length} unidades</span></div><div className="tc-filters"><Field label="Pesquisar por número, identificador ou usuário" value={search} onChange={e => setSearch(e.target.value)} /><label className="tc-field"><span>Status</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option><option value="disponivel">Disponível</option><option value="ativado">Ativado</option><option value="bloqueado">Bloqueado</option></select></label></div>
      {!batchId ? <p>Selecione um lote acima para consultar os cartões.</p> : <div className="tc-table-wrap"><table><thead><tr><th>Cartão / código</th><th>Status</th><th>Emissão / ativação</th><th>Proprietário</th><th>QR / ações</th></tr></thead><tbody>{cards.map(c => <tr key={c.id}><td><strong>#{String(c.number).padStart(3, '0')}</strong><small className="tc-break">{c.id}</small><small>Código protegido · disponível na exportação</small></td><td><span className={`tc-badge ${c.status}`}>{c.status}</span></td><td><small>{date(c.createdAt)}</small><small>{date(c.activatedAt)}</small></td><td>{c.ownerId ? <a className="tc-break" href={`/cartoes/p/${c.ownerId}`} target="_blank" rel="noreferrer">{c.ownerId}</a> : 'Aguardando ativação'}</td><td><a className="tc-text" href={`/cartoes/c/${c.id}`} target="_blank" rel="noreferrer">Abrir QR →</a>{c.status !== 'bloqueado' && (confirmBlock === c.id ? <div><span>Bloquear acesso a este cartão?</span><button className="tc-danger" disabled={busy} onClick={() => run(async () => { await cardsApi('block', { token: c.id }); setConfirmBlock(''); await load(); setMessage('Cartão bloqueado.') })}>Confirmar bloqueio</button><button className="tc-text" onClick={() => setConfirmBlock('')}>Cancelar</button></div> : <button className="tc-text" disabled={busy} onClick={() => setConfirmBlock(c.id)}>Bloquear</button>)}</td></tr>)}</tbody></table>{!cards.length && <p>Nenhum cartão encontrado para este filtro.</p>}</div>}
    </section>
  </div>
}
export default function CardsApp() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function refresh() { const value = await cardsApi('session'); setSession(value); return value }
  async function run(task) { if (busy) return; setBusy(true); setError(''); try { await task() } catch (error) { setError(friendlyError(error)) } finally { setBusy(false) } }
  useEffect(() => {
    let version = 0
    const unsubscribe = onAuthStateChanged(cardsAuth, async next => {
      const current = ++version
      setUser(next); setSession(null); setLoading(true)
      try { const result = next ? await cardsApi('session') : null; if (current === version) setSession(result) }
      catch (error) { if (current === version) setError(friendlyError(error)) }
      finally { if (current === version) setLoading(false) }
    })
    return () => { version++; unsubscribe() }
  }, [])
  const publicPage = route.page === 'public'
  return <div className={`tc-app ${publicPage ? 'ct-public-page' : route.page === 'account' && session?.profile ? 'ct-editor-page' : route.page === 'simulation' ? 'ct-simulation-page' : ''}`}><header className="tc-header">
    {publicPage ? <div className="tc-logo"><img src={contactLogo} alt="TOKKA Contact" width="2172" height="724" /></div> : <a className="tc-logo" href={session?.profile ? '/cartoes/conta' : '/cartoes'} aria-label="TOKKA Contact"><img src={contactLogo} alt="TOKKA Contact" width="2172" height="724" /></a>}
    {!publicPage && <nav aria-label="Cartões TOKKA">
      {session?.profile ? <><a href="/cartoes/conta" aria-current={route.page === 'account' ? 'page' : undefined}>Visão Geral</a><a href={`/cartoes/p/${user.uid}`}>Ver Perfil</a></> : <><a href="/cartoes/cadastro" aria-current={route.page === 'activate' ? 'page' : undefined}>Ativar cartão</a><a href="/cartoes/conta" aria-current={route.page === 'account' ? 'page' : undefined}>Meu perfil</a></>}
      {session?.isAdmin && <a href="/cartoes/admin" aria-current={route.page === 'admin' ? 'page' : undefined}>Painel</a>}
      {user && <button aria-label="Sair" className="tc-text" disabled={busy} onClick={() => run(() => signOut(cardsAuth))}><LogOut size={16} /><span>Sair</span></button>}
    </nav>}
  </header>
    <main className={`tc-main ${route.page === 'admin' ? 'tc-wide' : ''}`}>
      {error && <Notice>{error}<button className="tc-text" onClick={() => setError('')}>Fechar aviso</button></Notice>}
      {publicPage ? <ContactPublic profileId={route.profileId} run={run} /> : loading ? <section className="tc-panel" role="status">Preparando seu espaço…</section> : route.page === 'activate' ? <div className="tc-onboarding"><div className="tc-intro"><div className="tc-eyebrow">SEU CARTÃO. SUA HISTÓRIA.</div><h1>O encontro passa.<br /><em>A conexão fica.</em></h1><p>Transforme um primeiro contato em uma conexão que acompanha você.</p><div className="tc-card-art" aria-hidden="true"><strong>TOKKA</strong><QrCode size={64} /><span>FEITO PARA CONECTAR.</span></div><ol className="tc-journey">{['Receba sua caixa', 'Abra a embalagem', 'Escaneie o QR', 'Identifique seu cartão', 'Crie ou acesse sua conta', 'Ative e complete seu perfil'].map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol></div><div className="tc-flow"><Activation user={user} session={session} run={run} busy={busy} /></div></div> : route.page === 'account' ? !user ? <AuthForm run={run} busy={busy} /> : session ? <ContactAccount key={user.uid} user={user} session={session} refresh={refresh} run={run} busy={busy} /> : <section className="tc-panel"><Notice>Não foi possível carregar sua conta.</Notice><button className="tc-secondary" onClick={() => run(refresh)}>Tentar novamente</button></section> : route.page === 'simulation' ? !user ? <AuthForm run={run} busy={busy} /> : session ? <ContactSimulation user={user} session={session} /> : <section className="tc-panel"><p>Não foi possível carregar sua conta.</p><button className="tc-secondary" onClick={() => run(refresh)}>Tentar novamente</button></section> : route.page === 'admin' ? !user ? <AuthForm run={run} busy={busy} admin /> : session?.isAdmin ? <Admin run={run} busy={busy} /> : <section className="tc-panel"><ShieldCheck size={28} /><h2>Acesso restrito.</h2><p>Esta conta não tem permissão para administrar cartões. Entre com uma conta autorizada pela equipe TOKKA.</p><button className="tc-secondary" onClick={() => run(() => signOut(cardsAuth))}>Trocar conta</button></section> : <section className="tc-panel"><h1>Página não encontrada.</h1><a href="/cartoes">Ir para cartões TOKKA</a></section>}
    </main>{!publicPage && <footer className="tc-footer"><span>TOKKA © {new Date().getFullYear()}</span><span>Pessoas. Histórias. Conexões.</span></footer>}</div>
}
