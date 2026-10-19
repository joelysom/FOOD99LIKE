import { test, expect } from '@playwright/test'

const token = 'a'.repeat(48)
const routes = [
  ['/cartoes', 'Código de ativação'],
  ['/cartoes/', 'Código de ativação'],
  ['/cartoes/cadastro', 'Código de ativação'],
  ['/cartoes/conta', 'Bom ter você aqui.'],
  ['/cartoes/admin', 'Equipe TOKKA'],
  ['/cartoes/simulacao', 'Bom ter você aqui.'],
  [`/cartoes/c/${token}`, 'Cartão encontrado e disponível para ativação.'],
  ['/cartoes/p/production-test', 'Perfil de teste'],
]

test.beforeEach(async ({ context }) => {
  // Exercise the built frontend without reading or writing production Firebase data.
  await context.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === 'http://127.0.0.1:5177') return route.continue()
    if (url.pathname.endsWith('/cardsApi') && request.method() === 'POST') {
      const { action } = request.postDataJSON().data
      const data = action === 'resolve'
        ? { token, status: 'disponivel' }
        : { profileId: 'production-test', name: 'Perfil de teste', links: [] }
      return route.fulfill({ json: { data } })
    }
    return route.abort()
  })
})

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test.describe(`build de produção em ${viewport.width}px`, () => {
    test.use({ viewport })
    for (const [path, content] of routes) {
      test(`${path} carrega a interface e o CSS dos cartões`, async ({ page }) => {
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText(content, { exact: true })).toBeVisible()
        // DOM text alone passed even when Vite omitted the lazy app's stylesheet.
        await expect(page.locator('.tc-app')).toHaveCSS('background-color', 'rgb(9, 10, 11)')
        await expect(page.locator('.tc-logo')).toHaveCSS('display', 'block')
        expect(await page.locator('.tc-logo').evaluate(element => element.getBoundingClientRect().width)).toBeLessThan(150)
        if (path.includes('/p/')) {
          await expect(page.locator('.ct-public-hero')).toHaveCSS('background-color', 'rgb(9, 37, 85)')
          await expect(page.getByRole('button', { name: 'Salvar contato' })).toBeVisible()
        }
        const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => link.href))
        expect(styles.some(url => /\/CardsApp-[^/]+\.css$/.test(url))).toBe(true)
        expect(styles.some(url => /\/App-[^/]+\.css$/.test(url))).toBe(false)
        expect(errors).toEqual([])
      })
    }
  })
}

test('links existentes do cardápio continuam carregando seu próprio CSS', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const path of ['/', '/#cardapio-coco-bambu', '/c/8Ks29']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('link[rel="stylesheet"][href*="/App-"]')).toHaveCount(1)
    await expect.poll(() => page.locator('#root').innerText()).toMatch(/CATEGORIAS|indisponível|não encontrad/i)
    await expect(page.locator('.tc-app')).toHaveCount(0)
    await expect(page.locator('link[rel="stylesheet"][href*="/CardsApp-"]')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})
