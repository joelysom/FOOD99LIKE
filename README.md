# FOOD99LIKE React

Projeto React em JavaScript com Vite, Tailwind CSS v4 e interface mobile-first para cardápio digital.

## Rodar o projeto

```bash
npm.cmd install
npm.cmd run dev
```

Abra no navegador:

- `http://localhost:5173/` para abrir o acesso administrativo principal.
- `http://localhost:5173/#admin-principal` para abrir explicitamente o admin.
- `http://localhost:5173/#cardapio-coco-bambu` para abrir o cardápio público da loja.
- `http://localhost:5173/#menu` para manter compatibilidade com o link antigo do cardápio.
- `http://localhost:5173/#produto=cheddar-bacon` para abrir um produto direto.
- `http://localhost:5173/#configuracoes` para abrir o painel administrativo antigo.
- `http://localhost:5173/?adminTab=vezz#configuracoes` para abrir as métricas/Vezz.
- `http://localhost:5173/?adminTab=cartao#configuracoes` para abrir o preview do cartão físico.
- `http://localhost:5173/#pedido` para abrir a tela de pedido.
- `http://localhost:5173/?mesa=05#cardapio-coco-bambu` para simular abertura por NFC/QR da mesa 05.

## MVP implementado

- Cardápio direto na primeira tela, com visual escuro fixo, destaque da casa no hero, slide mais lento, busca por item/ingrediente e filtros por categoria.
- Produtos em duas colunas inspiradas em cardápio impresso, mantendo imagem, descrição, ingredientes e preço.
- Comandos de voz no cardápio para buscar itens, abrir produtos, trocar categoria e chamar a Vezz.
- Produto aberto com leitura opcional de ingredientes, observação e adição ao pedido.
- Pedido com mesa, nome opcional, tipo de atendimento e forma de pagamento.
- Admin minimalista por abas para editar, ativar/desativar e criar itens do cardápio.
- Aba de mesas com link NFC/QR por mesa.
- Aba Vezz com painel local de acessos, cliques, CTR, pedidos e interesse por horário.
- Aba de cartão físico com preview de NFC, QR, WhatsApp, Instagram, Wi-Fi e área visual de braille.

## Dados e privacidade

Este MVP registra eventos discretos no `localStorage` e uma sessão anônima no `sessionStorage`.
Quando o Firebase estiver ativo e as regras publicadas, esses mesmos eventos também são enviados ao Firestore e ao Firebase Analytics: abertura do menu, busca, comando de voz, clique em Vezz, visualização de produto, adição ao carrinho e pedido enviado.
Pedidos confirmados criam documentos em `restaurants/tokka-foods/orders`; eventos criam documentos em `restaurants/tokka-foods/events`.

Para produção, o próximo passo é ativar autenticação de admin, cadastrar o primeiro administrador e publicar a política de consentimento/privacidade.

## Firebase

O projeto já está configurado para o Firebase `tokka-foods`.

```bash
npm.cmd install
npm.cmd run firebase:login
npm.cmd run firebase:projects
npm.cmd run firebase:deploy:firestore-rules
```

Depois do primeiro login, a autorização fica salva no Firebase CLI local. Com isso, as próximas atualizações de rules podem ser feitas direto por comando:

```bash
npm.cmd run firebase:deploy:rules
```

Se o Storage ainda não tiver sido inicializado no Firebase Console, use primeiro:

```bash
npm.cmd run firebase:deploy:firestore-rules
```

Depois de abrir Storage > Get Started uma única vez no console, publique tudo:

```bash
npm.cmd run firebase:deploy:rules
```

Arquivos principais:

- `.firebaserc`: aponta o projeto padrão para `tokka-foods`.
- `firebase.json`: configura Firestore, Storage, Hosting e emuladores.
- `firestore.rules`: libera criação pública e limitada de eventos/pedidos; leitura e escrita administrativa exigem admin autenticado.
- `storage.rules`: libera leitura pública de assets do restaurante e escrita apenas para admin.
- `.env.example`: variáveis Vite para Vercel ou ambiente local.

## Acessibilidade

- A primeira tela agora é o cardápio, reduzindo um passo para quem usa leitor de tela.
- O botão discreto no topo esquerdo ativa a descrição automática da comida ao abrir um item.
- Na tela do produto, o botão de alto-falante narra uma descrição acessível com montagem, textura, aroma e principais sabores.
- Ao voltar do produto ou desativar o leitor, a leitura em andamento é cancelada.
- A leitura por voz expande abreviações como `150g` para `150 gramas` e ajusta termos como bacon para uma pronúncia mais natural.
- O botão de microfone no cardápio aceita comandos como `abrir cheddar bacon`, `mostrar bebidas`, `quanto custa pizza` e `chamar Vezz`.
- Os cards, categorias, mesas e controles de quantidade possuem labels e estados para leitores de tela.

## Deploy Vercel

O projeto já possui `vercel.json` com:

- build: `npm run build`
- saída: `dist`
- rewrite SPA para `index.html`

Na Vercel, importe o repositório/projeto e use o preset Vite.

## NFC e QR

Para NFC/QR por mesa, grave na etiqueta ou no QR um link neste formato:

```txt
https://seu-dominio.vercel.app/?mesa=05#cardapio-coco-bambu
```

Ao abrir esse link, o cardápio já entra na tela de menu com a mesa preenchida.

## Estrutura

- `src/App.jsx`: interface principal com componentes React e classes Tailwind.
- `src/assets/`: imagens locais usadas nas telas.
- `src/index.css`: import obrigatório do Tailwind.
- `vite.config.js`: Vite com React e plugin oficial do Tailwind.
- `vercel.json`: configuração de deploy e fallback SPA.

Este projeto evita arquivos `.css` por componente. O único CSS mantido é o ponto de entrada necessário para o Tailwind gerar os estilos.

## Cart?es individuais TOKKA

O aplicativo independente de emiss?o, ativa??o e perfis fica em `/cartoes`, no mesmo dom?nio. Os links atuais do card?pio permanecem preservados. Consulte [configura??o, opera??o e testes](README-cartoes.md).
