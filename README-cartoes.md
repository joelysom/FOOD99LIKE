# TOKKA Cartões

O aplicativo fica em `https://nfcfoodtest.vercel.app/cartoes`. Os cartões usam **Firebase Auth e Firestore do projeto `tokka-foods`**, com uma sessão independente. As configurações do restaurante em `src/lib/firebaseConfig.js`, os links NFC de mesas, os hashes do cardápio e `/c/8Ks29` permanecem preservados.

O backend está na Vercel, no projeto `tokka-cards-api`. O navegador chama `/api/cards` no domínio atual; um rewrite encaminha essa rota para `https://tokka-cards-api.vercel.app/api/cards`. O fallback original das demais rotas continua igual. Este fluxo não depende de Cloud Functions, Secret Manager nem Cloud Storage e não exige ativar o Blaze no Firebase. Aplicam-se as cotas dos planos contratados.

## Interface e endereços

A interface foi adaptada de [eusettee/tokka-contact](https://github.com/eusettee/tokka-contact), revisão `1cf7f03b94b384d50dd06783b51de5199cb1c917`. Logo, ondas, Google Sans e ícones têm sua origem registrada em `src/cards/assets/`. O tema escuro fica restrito a `/cartoes`.

- `/cartoes` e `/cartoes/cadastro`: identificação pelo código impresso e criação/acesso à conta.
- `/cartoes/c/TOKEN`: QR individual estável. Abre a ativação ou encaminha ao perfil de um cartão já ativado.
- `/cartoes/conta`: editor responsivo de nome, usuário, foto, cargo, empresa, logo, bio, telefone, e-mail público, localização, site e links.
- `/cartoes/p/UID`: perfil público, vCard, ligação e links ativos. O e-mail de login nunca é publicado automaticamente.
- `/cartoes/simulacao`: prévia do perfil publicado.
- `/cartoes/admin`: emissão, lotes, pesquisa, bloqueio, CSV e kit de impressão. Exige permissão específica no servidor.

O editor aceita até 20 links de WhatsApp, LinkedIn, Instagram, Meet, Pix, site, e-mail, telefone ou PDF por HTTPS. Alterações usam revisão para evitar sobrescrita entre abas. O QR permanece igual após editar o perfil.

Fotos e logos de até 10 MB são redimensionadas no navegador para até 1024 pixels e convertidas em uma imagem de até 400 KB, reduzindo as dimensões novamente quando necessário. Navegadores sem `createImageBitmap` usam a leitura por elemento de imagem. A API verifica tipo, assinatura do arquivo, tamanho, proprietário e estado do cartão. As imagens ficam em documentos privados do Firestore e são servidas pela API somente enquanto o cartão estiver ativo. Não há bucket de Storage obrigatório. O transporte legado opcional por Cloud Functions/Storage mantém seu limite de 2 MB.

Dados e imagens são publicados ao clicar em **Salvar perfil**; links são publicados na hora. Erros de envio aparecem junto ao botão de salvar e os campos e fotos pendentes permanecem disponíveis para tentar novamente. O usuário exige 3 a 30 letras minúsculas, números ou `_`, sem `@`, espaços ou acentos.

## Configuração

As variáveis `VITE_CARDS_FIREBASE_*` pertencem somente aos cartões. Os valores públicos padrão vêm do aplicativo web cadastrado em `tokka-foods`. As variáveis antigas `VITE_FIREBASE_*` continuam exclusivas do restaurante. `.firebaserc` mantém o default anterior e acrescenta o alias `cards` para `tokka-foods`.

A API precisa destes **segredos de produção no projeto Vercel do backend**, nunca no frontend:

- `CARDS_FIREBASE_SERVICE_ACCOUNT`: JSON da conta de serviço dedicada `tokka-cards-api@tokka-foods.iam.gserviceaccount.com`.
- `CARDS_EXPORT_KEY`: 32 bytes aleatórios em base64 para criptografia AES-256-GCM dos códigos.
- `CARDS_PUBLIC_ORIGIN`: origem HTTPS do domínio impresso, atualmente `https://nfcfoodtest.vercel.app`.

A conta de serviço usa somente `roles/datastore.user` e `roles/firebaseauth.viewer`. A API verifica o ID token e sua revogação, usa o UID autenticado e consulta `cardsAdmins` antes de operações administrativas. Dados e segredos não são registrados em logs nem incorporados ao bundle do navegador.

O provisionamento está em `scripts/setup-cards-vercel.mjs`: reutiliza a configuração privada, configura a conta de serviço, acrescenta o domínio autorizado sem remover os anteriores e importa o lote solicitado. Ele recusa gerar outra chave se já houver cartões no banco. A configuração fica em `.cards-private/tokka-foods-vercel.json`, ignorada por Git e Vercel e protegida por permissões locais. **Guarde backup seguro desse arquivo**. Trocar a chave sem migrar os códigos impede reimpressão de lotes anteriores. Não publique esse arquivo, arquivos `.env`, tokens ou listas de códigos.

## Publicar o backend

Instale as dependências do projeto e de `functions/`. Em seguida:

```powershell
npm.cmd run cards:prepare-backend
vercel link --yes --project tokka-cards-api --scope joelysonsilva-8777s-projects --cwd .cards-test/vercel-backend
vercel deploy --prod --yes --scope joelysonsilva-8777s-projects --cwd .cards-test/vercel-backend
```

O preparador copia somente o código necessário para uma pasta de implantação ignorada. O build instala as dependências de `functions/`. Os três segredos devem estar cadastrados na Vercel antes do deploy; use entrada por stdin ou o painel, sem colocar seus valores em argumentos de shell. O frontend segue o deploy GitHub/Vercel já existente. A API não precisa estar no mesmo time Vercel do frontend: o rewrite é restrito a `/api/cards`.

`functions/index.mjs` continua disponível para instalações que optem por Cloud Functions; `VITE_CARDS_TRANSPORT=functions` seleciona esse transporte. Ele não é necessário para a instalação atual sem Blaze.

## Importar códigos já impressos

O importador aceita um arquivo privado com 1 a 150 códigos, um por linha. Aceita códigos curtos de 8 letras/números e os códigos de 20 caracteres já gerados. Busca ignora espaços, hífens e diferenças de maiúsculas/minúsculas. A geração normal continua usando 20 caracteres aleatórios com `crypto.randomBytes` e rejeição de viés.

```powershell
npm.cmd run firebase:import-cards -- --file ARQUIVO_PRIVADO --origin https://nfcfoodtest.vercel.app --project tokka-foods --firebase-account EMAIL_GOOGLE_AUTORIZADO --key-file .cards-private/tokka-foods-vercel.json
```

A conta indicada deve estar conectada à CLI do Firebase e ter acesso administrativo ao Firestore. Sem `--firebase-account`, o script utiliza Application Default Credentials. A chave vem do arquivo protegido indicado; instalações com Secret Manager podem omitir `--key-file`.

Uma transação cria lote, inventário, índices por hash e auditoria. Nenhuma conta fictícia é criada: os cartões ficam disponíveis até uma pessoa criar sua conta real e ativá-los. Repetir a mesma lista não duplica cartões nem desfaz ativações. Se algum código pertencer a outro lote, a transação é recusada sem alterações. O script confere a quantidade persistida.

## Administração e impressão

Para conceder acesso, crie uma conta real no Auth, anote o UID e execute com credenciais administrativas confiáveis:

```powershell
npm.cmd run firebase:grant-cards-admin -- UID_FIREBASE
```

O script verifica a conta e grava `cardsAdmins/UID` e auditoria no projeto `tokka-foods`. O papel do restaurante não concede essa permissão automaticamente. Para revogar, defina `active: false` nesse documento por ferramenta administrativa confiável.

No painel, a geração aceita de 1 a 1000 cartões, com 300 por padrão. O requestId permite retomar uma emissão interrompida. Somente lotes concluídos podem ser ativados ou exportados.

- CSV: número, IDs, lote, código, estado, proprietário, datas e URL; inclui proteção contra fórmulas.
- Kit ZIP: QRs individuais SVG, folheto geral SVG e `imprimir.html` com cartões de 85,6 × 54 mm.
- Abra o HTML e imprima em A4, escala 100%, ou salve em PDF. Valide prova, leitura do QR e acabamento com a gráfica; o kit não aplica sangria.

Códigos só são decifrados em exportação administrativa auditada. CSV e ZIP permitem ativar cartões disponíveis e devem ser distribuídos com acesso restrito. O QR individual também permite reivindicar um cartão ainda não ativado; mantenha os arquivos protegidos até a entrega.

## Dados e segurança

Todas as coleções `cards*` e as imagens são privadas ao SDK do navegador. O backend acessa o banco com Admin SDK e aplica autenticação, autorização, validação e limites transacionais.

- `cardsBatches`, `cardsInventory` e `cardsCodes`: lotes, tokens aleatórios de 192 bits, estados, proprietário, código criptografado e índice SHA-256.
- `cardsProfiles` e `cardsUsernames`: perfil vinculado ao UID e reserva atômica do nome de usuário.
- `cardsImages/UID/files/{avatar,company-logo}`: imagens validadas, com acesso público mediado pela API.
- `cardsAdmins`, `cardsAudit`, `cardsLimits`: permissões, histórico e contadores por hash de IP/UID. Logs não contêm códigos, segredos nem IPs em claro.

Ativação verifica cartão, lote e perfil e grava o vínculo em uma transação. Uma conta tem no máximo um cartão; uma segunda pessoa não pode tomá-lo. Bloqueio preserva proprietário/histórico e suspende perfil e imagens públicos. Nome de usuário e conteúdo podem mudar sem alterar os endereços impressos.

Limites por minuto: consulta 60, ativação 12, edição 20, perfil/imagem públicos 120 e geração/exportação/upload 10. São compartilhados entre instâncias da API. Os contadores vencidos podem ser removidos por rotina administrativa; TTL não é necessário para validar os limites.

## Desenvolvimento e testes

```powershell
npm.cmd run cards:api
npm.cmd run dev
npm.cmd run test:cards:http
npm.cmd run test:cards:integration
npm.cmd run test:production
npm.cmd run test:menu
```

A API local usa a configuração privada, portanto fora dos testes pode acessar produção. Os testes nunca a utilizam: exigem emuladores e o projeto `demo-tokka-cards`. O executor configura chave temporária, origem `https://cards.example.test` e restaura os arquivos locais ao terminar. O navegador exercita a API HTTP real local, com Firebase Auth e Firestore emulados, incluindo upload sem Storage. As integrações antigas de Functions/Storage continuam cobertas.

O modo padrão testa a API HTTP com Auth/Firestore. Para executar também a integração opcional de Functions/Storage, use `node scripts/test-cards.mjs --legacy`.

Requisitos: Java 21, dependências de `functions/`, Chromium do Playwright e portas 18080, 19099, 19199, 15001, 15002 e 5174. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` permite indicar um Chromium instalado.

O teste de produção compila o frontend e confere CSS, celular, desktop, links diretos e rotas anteriores. Cada aplicativo mantém seu próprio carregador `lazy`, necessário para o Vite carregar o CSS correto no build final.
