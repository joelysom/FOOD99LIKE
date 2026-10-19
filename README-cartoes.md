# TOKKA Cartões — aplicativo independente no domínio atual

Implementado com React/Vite, Firebase Auth, Cloud Functions (2ª geração), Firestore e Storage existentes. As rotas por hash, URLs NFC de mesas, `/c/8Ks29`, configurações de restaurante, `vercel.json` e rewrites de Hosting permanecem preservados. O novo módulo é carregado apenas em `/cartoes` e usa uma sessão Firebase nomeada, independente do login do restaurante.

## Endereços

- `/cartoes` e `/cartoes/cadastro`: QR geral do folheto, identificação por código e cadastro/login.
- `/cartoes/c/TOKEN`: QR individual estável; cartão disponível abre ativação; ativado encaminha ao perfil; bloqueado informa indisponibilidade.
- `/cartoes/conta`: área privada, edição de nome, username, foto, bio e site.
- `/cartoes/p/UID`: perfil público estável, com apenas dados autorizados.
- `/cartoes/admin`: emissão, totais, histórico de lotes, pesquisa, bloqueio e exportação.

Todos os novos caminhos já funcionam com o fallback SPA atual do Firebase Hosting e da Vercel. Não há necessidade de alterar DNS, domínio, links antigos nem rewrites para API: o SDK chama a Cloud Function autenticada diretamente.

## Configuração para produção

1. `npm.cmd install` e `npm.cmd install --prefix functions`. Backend em Node 22; desenvolvimento também validado com Node 24.
2. No projeto Firebase atual (`tokka-eb4ae`), habilite Auth por e-mail/senha e inclua o domínio atual nos domínios autorizados. É a mesma base de identidades do restaurante; o novo app guarda sua sessão separadamente. Não há criação pública de administradores.
3. Cloud Functions requer faturamento habilitado. Configure `CARDS_PUBLIC_ORIGIN` com **a origem HTTPS exata do domínio atual**, sem caminho, consulta ou hash. A CLI solicita esse parâmetro no primeiro deploy; também pode ser definido em `functions/.env.tokka-eb4ae`. Nunca use localhost. Cada lote guarda a origem de emissão para manter os endereços de reimpressão estáveis. Não altere o domínio depois de imprimir sem manter os endereços anteriores acessíveis.
4. Gere uma chave aleatória de 32 bytes em base64 em um gerenciador seguro. Cadastre por entrada interativa, sem colocá-la no código nem no frontend:

   ```powershell
   npx.cmd firebase functions:secrets:set CARDS_EXPORT_KEY
   ```

   Guarde backup seguro. A chave criptografa os códigos para reimpressão. Substituí-la sem migrar os dados impede decifrar lotes anteriores. A Cloud Function usa Secret Manager; `CARDS_EXPORT_KEY` não deve receber prefixo `VITE_`.
5. Cadastre uma conta real no Auth. Anote seu UID. Com credenciais administrativas confiáveis (Application Default Credentials, por exemplo `gcloud auth application-default login`, ou `GOOGLE_APPLICATION_CREDENTIALS` apontando para credencial protegida), conceda acesso específico a cartões:

   ```powershell
   npm.cmd run firebase:grant-cards-admin -- UID_FIREBASE
   ```

   O script valida a existência da conta e grava `cardsAdmins/UID` e auditoria. O papel administrativo do restaurante não concede esse acesso automaticamente. Para revogar, defina `active: false` nesse documento por ferramenta administrativa confiável.
6. Publique backend e regras:

   ```powershell
   npm.cmd run firebase:deploy:cards
   ```

7. Publique o frontend pelo fluxo já utilizado no domínio atual. Se ele estiver no Firebase Hosting, use `npm.cmd run firebase:deploy:hosting`. Se estiver na Vercel, publique o build nesse mesmo projeto Vercel. O backend permanece no Firebase em ambos os casos. Não foi criado outro site ou domínio.
8. Recomenda-se habilitar TTL para `cardsLimits.expiresAt` no Firestore. A limitação funciona sem TTL; ele evita acumular buckets vencidos. Não é necessário índice composto nem migração de dados existentes.

As integrações reais precisam desses parâmetros, permissões e deploy. O trabalho local não emite cartões no banco de produção nem cria contas fictícias nele.

## Operação e impressão

Entre em `/cartoes/admin`, escolha a quantidade (300 por padrão, entre 1 e 1.000) e gere o lote. A confirmação só aparece após persistência. Em falha de conexão, use **Retomar emissão**, inclusive ao reabrir a aba; o identificador do pedido evita duplicatas. Lotes em emissão também aparecem no histórico e podem ser retomados pela conta responsável. Cartões desses lotes não podem ser ativados antes de concluir a emissão.

Selecione o lote e exporte:

- **CSV**: número, identificadores, código, status, UID do proprietário, datas e URL. Proteção contra fórmulas em células.
- **Kit ZIP**: QR individual SVG com margem de segurança, `imprimir.html` vetorial em cartões de 85,6 × 54 mm, QR geral `folheto-cadastro.svg` e instruções.
- Abra `imprimir.html`, imprima em A4 a 100% ou use **Salvar como PDF**. Valide a prova, leitura do QR, área de corte e sangria com a gráfica antes da tiragem. O kit não aplica sangria.

Os códigos ficam mascarados na listagem e só são decifrados em exportação autenticada e auditada. CSV e ZIP contêm credenciais de ativação de cartões disponíveis: distribua com acesso restrito. O QR individual é um token de posse para cartões ainda não ativados, conforme o fluxo solicitado; qualquer pessoa que receba sua URL antes da entrega pode reivindicar o cartão. O folheto geral não contém credenciais individuais.

## Dados e segurança

Coleções novas, todas sem leitura/escrita direta pelo SDK do navegador:

- `cardsAdmins`: permissões específicas, concedidas somente por Admin SDK.
- `cardsBatches`: quantidade, progresso, origem, estado, responsável e datas.
- `cardsInventory`: token público aleatório de 192 bits, lote, número, status, UID, datas e código criptografado AES-256-GCM.
- `cardsCodes`: ID SHA-256 do código → cartão. Códigos têm 20 símbolos sem caracteres ambíguos, cerca de 99 bits, gerados por `crypto.randomBytes` com rejeição de viés. Criações com precondição garantem unicidade de códigos/tokens no banco, inclusive entre lotes.
- `cardsProfiles`: perfil público associado ao UID, sem e-mail, senha ou credencial de ativação.
- `cardsUsernames`: reserva atômica de usernames exclusivos.
- `cardsAudit`: emissão, exportação, ativação, recusas e bloqueios, sem códigos nem IPs em claro.
- `cardsLimits`: limites transacionais por hash de IP e UID, compartilhados entre instâncias.

`cardsApi` valida autenticação e papel administrativo no backend. Geração usa blocos de até 150 cartões e só libera ativação depois do lote completo; repetir o mesmo requestId retoma a operação. Ativação lê cartão, perfil e lote em uma transação e grava proprietário/perfil/auditoria juntos. O documento de perfil por UID impede dois cartões por conta. A repetição da ativação pelo próprio dono é idempotente, sem transferência. Nenhuma API aceita escolher o dono de um perfil: usa sempre o UID autenticado.

O acesso público retorna somente nome, username, bio, foto e site; cartão bloqueado também suspende o perfil público. Bloqueio mantém proprietário e histórico, sem reatribuir cartão. Fotos JPG/PNG/WebP de até 2 MB são enviadas somente pelo dono, no caminho isolado `cards/profiles/UID/avatar`. Links públicos aceitam apenas HTTPS. Alterar username não altera o endereço do perfil.

Limites atuais por minuto: consulta 60, ativação 12, edição 20, perfil público 120, geração/exportação 10. Limites de IP também se aplicam a conexões compartilhadas em eventos; ajuste no backend conforme o volume real. O Firebase Auth também protege suas próprias operações de login. App Check pode ser adicionado como camada adicional; não foi habilitado globalmente para não interferir nos módulos atuais.

## Testes

```powershell
npm.cmd run test:cards
npm.cmd run test:menu
npm.cmd run test:cards:integration
npm.cmd run test:cards:browser
npm.cmd run build
```

Integração e navegador usam exclusivamente `demo-tokka-cards`, emuladores Auth/Firestore/Storage/Functions, chave temporária de teste e `https://cards.example.test` como origem fictícia de emissão. O executor restaura os arquivos locais de segredo/ambiente ao finalizar. Requer Java 21, dependências de `functions/`, navegadores Playwright e portas de teste 18080, 19099, 19199, 15001 e 5174 disponíveis. Se necessário instale Chromium com `npx.cmd playwright install chromium`. Nenhum teste usa dados de produção.

Os testes verificam emissão de 300, idempotência, unicidade entre lotes, contas reais do Auth emulado, ambos os meios de ativação, QR ativo, proteção de dados públicos, reuso recusado, corrida entre contas, painel, bloqueio, permissões, unicidade de usernames, Storage, persistência, força bruta, downloads e jornada responsiva no navegador. Os testes anteriores de cardápio são mantidos.

O executor mant?m configura??o do CLI, caches dos emuladores e tempor?rios em `.cards-test/`, sem usar as credenciais de login do Firebase CLI do operador.

Refer?ncias oficiais: [fun??es callable](https://firebase.google.com/docs/functions/callable), [transa??es do Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Arquivos da implementa??o

- `src/cards/`: rotas, cliente Firebase isolado, interface, estilos e exporta??o CSV/ZIP/SVG.
- `src/main.jsx`: sele??o do aplicativo por `/cartoes`, mantendo o aplicativo anterior nas demais URLs.
- `src/lib/firebaseConfig.js` e `src/lib/firebase.js`: configura??o compartilhada sem alterar os valores existentes; inicializa??o antiga preservada.
- `functions/index.mjs`, `functions/cards-service.mjs`, `functions/package.json` e `functions/package-lock.json`: API, transa??es, criptografia, limites e depend?ncias do backend.
- `firestore.rules` e `storage.rules`: isolamento dos dados e permiss?es das fotos.
- `scripts/grant-cards-admin.mjs` e `scripts/test-cards.mjs`: concess?o de acesso e executor isolado dos testes.
- `tests/cards.*`: testes de rotas, integra??o, regras e navegador.
- `firebase.json`, `package.json`, `package-lock.json`, `.env.example`, `.gitignore` e `README.md`: configura??o adicional, comandos e documenta??o.

O executor pode reutilizar Chromium j? instalado no Windows. Para outro execut?vel, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Em m?quinas lentas, a descoberta de fun??es nos testes j? usa `FUNCTIONS_DISCOVERY_TIMEOUT=120`.

## Valida??o realizada

Em 14/10/2026: build de produ??o aprovado; 1 teste de rotas aprovado; 7 testes anteriores de persist?ncia do card?pio aprovados; 14 verifica??es de integra??o aprovadas (13 cen?rios de backend/regras/Storage e a jornada de navegador, que cont?m 2 cen?rios Playwright aprovados). A jornada validou CSV/ZIP, cadastro, ativa??o, edi??o, recarga, logout/login, perfil p?blico pelo QR e preserva??o dos links antigos. Foram inspecionados o painel desktop e o perfil mobile. Nada foi publicado em produ??o nesta execu??o.
