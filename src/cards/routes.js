export function getCardsRoute(pathname) {
  const path = pathname.replace(/\/$/, '')
  if (path === '/cartoes' || path === '/cartoes/cadastro') return { page: 'activate' }
  if (path === '/cartoes/conta') return { page: 'account' }
  if (path === '/cartoes/admin') return { page: 'admin' }
  if (path === '/cartoes/simulacao') return { page: 'simulation' }
  const card = path.match(/^\/cartoes\/c\/([a-f0-9]{48})$/)
  if (card) return { page: 'activate', token: card[1] }
  const profile = path.match(/^\/cartoes\/p\/([a-zA-Z0-9_-]{1,128})$/)
  if (profile) return { page: 'public', profileId: profile[1] }
  return { page: 'missing' }
}
