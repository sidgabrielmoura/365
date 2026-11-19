# Integração do backoffice

## Contrato completo do painel

A implementação atual usa o guia `layout-betano-backend-api.md`. O catálogo do BFF tem 110 combinações de método e rota, incluindo as versões por perfil e o método de exclusão de clientes recomendado pelo guia. O modo de demonstração continua disponível por configuração explícita.

| Fluxo | Onde usar |
| --- | --- |
| Entrar, cadastrar, sair e editar telefone, endereço ou senha | Cabeçalho e área da conta. `/register?ref=CODIGO` abre o cadastro com a indicação. |
| Saldo, Pix de depósito, consulta do Pix, elegibilidade e saque | Carteira Pix nos controles existentes do cabeçalho e em `/conta/banco`. |
| Histórico de movimentações, depósitos, saques e jogadas de cassino | `/conta/extratos` pelo botão Histórico da conta conectada. |
| Grade, mercados, busca, destaques e calendário | Home, páginas de esportes, `/evento/[id]`, `/esportes/ligas` e `/apostas/destaques`. |
| Odds turbinadas, dicas e ganhadores | `/apostas/destaques` e aba de odds aumentadas no detalhe do evento. A dica também aceita `/?hash=CODIGO`. |
| Grade e mercados ao vivo, placar e estatísticas disponíveis | `/ao-vivo` e `/ao-vivo/jogo/[id]`, via Socket.IO. |
| Bilhete, Criar Aposta, histórico, comprovante e cashout | Bilhete existente, `/minhas-apostas` e `/ticket/bet/[id]`. A oferta de cashout é renovada enquanto o card está aberto. |
| Pré-bilhete e venda esportiva | `/pre-bilhete`, acessível pelo bilhete para visitante ou cambista conforme as regras do tenant. |
| Caixa, saldos, clientes, relatório, bilhetes, cancelamento e validação de PIN | `/cambista`, acessível em Minha Conta no perfil de cambista. |
| Extrações e modalidades do Tradicional, concursos, loterias, 2 Para 500 e Surpresinha | `/tradicional`, `/loterias`, `/2para500` e comprovantes em `/ticket/tradicional/[id]` e `/ticket/loto/[id]`. |
| Catálogo, provedores, busca, lançamento e raspadinhas | `/cassino`, `/cassino/destaques` e `/raspadinhas`. O cassino abre a URL devolvida pelo provedor em outra aba. |
| Regulamento e editor do painel | `/termos` e `/theme-builder?token=…`. O editor grava a lista completa de cores no painel sob confirmação explícita. O clone conserva seu CSS. |

### Limites de verificação e do contrato

- O cadastro, a edição da conta, as apostas, os pagamentos e os saques usam os payloads do guia. O teste com a conta fornecida consulta sessão, saldo, bilhetes e extratos. Nenhuma operação financeira, alteração de cadastro ou compra foi enviada ao painel durante a verificação.
- As telas condicionadas ao perfil de cambista, aos módulos e ao token do editor precisam da conta ou habilitação correspondente para uso. O teste da conta fornecida valida o perfil jogador online. O Redis pode ser configurado em produção. A instalação local usa o arquivo explicitamente configurado para o tenant.
- O preço combinado do Criar Aposta é uma estimativa limitada pela configuração. O guia fornece os dados de desconto e correlação, sem definir a fórmula completa de composição. O painel recalcula o valor na confirmação.
- O guia não define recuperação de senha, alteração de e-mail, cancelamento pelo jogador, promoções por cupom, recompensas, preferências persistidas, revogação de dispositivos ou limites de jogo responsável. Essas ações permanecem sem integração real. Um tenant que exige reCAPTCHA também precisa da chave pública e da integração do widget do operador.
- O painel custodia os pagamentos. Limites inconsistentes de saque bloqueiam a solicitação até que o operador ajuste a configuração.

### Identidade visual por banca

O domínio resolve o tenant no Redis ou no arquivo local configurado. O `site_id` desse tenant seleciona o JSON do CDN. O nome, o logo do cabeçalho e o favicon vêm do registro do tenant. O ícone de instalação pode vir de `settings.native_app_logo`. O tema ativo do CDN tem precedência sobre as chaves correspondentes de `custom_theme`.

O backoffice aplica a identidade da banca por padrão. O carrossel prioriza os banners configurados que se aplicam à sessão. Quando a lista está vazia, usa as quatro imagens de referência do projeto. O modo de demonstração e a opção explícita `BACKOFFICE_BRANDING=clone` usam a identidade de referência.

### Fonte de bancas na Vercel

Com `BACKOFFICE_MODE=backoffice`, configure `REDIS_HOST` para ler a chave `sites`, ou use `BACKOFFICE_TENANTS_JSON` com a mesma estrutura de `sites`. Para a instância atual em `365-smoky.vercel.app`, este é o valor da variável pela opção JSON.

```json
{"wtfsportslive":{"site_id":"wtfsportslive","front_url":"365-smoky.vercel.app","base_url":"painel.maranguapeloterias.top","complete_name":"Maranguape Loterias","status":"actived","modules":["bet","casino","online","traditional","loto","2p500","scratchcard","bet-builder"],"logo_url":"https://d3b875vnwmvuxq.cloudfront.net/storage/wtfsportslive/images/wtfsportslive_logo.webp","isotype_url":"https://d3b875vnwmvuxq.cloudfront.net/storage/wtfsportslive/images/wtfsportslive_logo.png"}}
```

O domínio acessado deve corresponder a `front_url`. Use o domínio estável do projeto, ou substitua-o pelo domínio final quando fizer a mudança. O arquivo `.local` tem prioridade quando configurado. Na Vercel, mantenha `BACKOFFICE_TENANTS_FILE` e `BACKOFFICE_CONTRACTS_FILE` ausentes e configure `BACKOFFICE_SESSION_SECRET` como segredo próprio do ambiente. O JSON tem prioridade sobre o Redis quando ambos estão presentes. Aplique a configuração ao fazer um novo deploy e confirme o `site_id` retornado por `/api/environment`.

## Registro histórico da etapa inicial

Atualizado em 18/11/2026. Projeto: C:/Users/gabriel/development/clones/bet365.

Esta etapa começa a execução do mapa de integração. **Não representa a conclusão de todas as 104 operações na interface.** O transporte cobre o catálogo completo, mas várias operações continuam sem payload/retorno documentados ou sem uma área correspondente no clone.

## Layout preservado

Após a orientação de não modificar o layout, foram mantidos os componentes e as páginas existentes. Não foram criadas novas telas de cambista, Tradicional, loterias, raspadinhas ou editor. A integração usa fontes de dados, adaptadores, providers, eventos e loaders das páginas atuais.

O teste tests/backoffice/layout.test.ts compara as tags/classes JSX de 19 componentes com a versão anterior à integração. Também compara o SHA-256 dos nove arquivos de estilo, incluindo public/reference.css: permanecem idênticos. A marca visual, navegação, fontes, espaçamentos e templates do clone foram mantidos. Conteúdo e quantidades retornados pela API naturalmente podem diferir das capturas.

## Ambiente configurado

- Identificador confirmado no CDN: wtfsportslive.
- Nome retornado: Maranguape Loterias.
- Painel: https://painel.maranguapeloterias.top.
- Endereço local: http://127.0.0.1:3000.
- Modo ativo neste computador: BACKOFFICE_MODE=backoffice.
- Credenciais de teste e segredo de sessão ficam exclusivamente no .env.local, ignorado pelo controle de versão.

O tenant local está em .local/backoffice/tenants.json. Esse arquivo permite começar sem credenciais de Redis. Os módulos foram montados a partir da configuração pública encontrada; não equivalem a uma leitura validada do registro privado sites. Para produção, configurar o domínio real e conectar o Redis ou fornecer uma lista de tenants revisada pelo operador.

BACKOFFICE_MODE=demo seleciona explicitamente a demonstração original. Nenhum erro da integração real aciona automaticamente SQLite, saldo fictício ou apostas simuladas.

## Implementado nesta etapa

| Parte | Implementação |
| --- | --- |
| Catálogo | 104 combinações de método/path, preservando versões, autenticação e grafias do documento. |
| BFF | /api/backoffice/[...path], limitado a operações permitidas, sem aceitar outro host por query/path. |
| Tenant | Resolução por host, normalização, arquivo local ou Redis GET sites, cache da lista por 60 s e último valor válido. |
| Parâmetros | JSON do CDN sem cache; configuração online aplicada somente ao jogador online autenticado. |
| Sessão | Login real, cookie HttpOnly criptografado e vinculado ao tenant/painel, hidratação, saldo, logout e expiração por 401. |
| Níveis | Separação online/cambista; cambista não chega a endpoints /api/online/*. |
| Segurança de transporte | Origem validada nas mutações, bloqueio de traversal/redirecionamento de host, sem cache de respostas do painel e sem repetição automática de POST financeiro. |
| Esportes | Grade real nos templates existentes da home/próximos/esportes; ligas; loader do jogo e mercados reais. |
| Ao vivo | Socket.IO compartilhado, join:grid, grid:update e leave:grid, com limpeza de assinaturas. |
| Histórico esportivo | Listagem paginada real e comprovantes com seleções, usando os cards existentes. |
| Extrato | Movimentações reais nas páginas atuais de histórico/atividade. |
| Cassino | Vitrines, listagem/pesquisa/paginação e detalhe de jogo por referência real, preservando os templates. |
| Regulamento | Endpoint interno com HTML sanitizado, disponível para conexão aos pontos de conteúdo existentes. |
| Fluxos com contrato incompleto | Gateway de ações e bindings configuráveis; as mutações sem contrato confirmado falham antes do envio. |
| Cashout | Cliente Ably com TokenRequest do painel e ciclo de vida de keep-alive; desativado até confirmar o contrato da oferta. |
| Proteção visual | Testes de estrutura/classes e hashes dos estilos originais. |

Os esportes observados e mapeados neste tenant foram futebol 1, basquete 2, MMA 4, tênis 5, vôlei 6 e futebol americano 8. A cobertura dos demais slugs do clone precisa de confirmação. A aplicação não usa IDs capturados do BrasaBet para consultar outra modalidade no painel.

## Divergências confirmadas entre documento e painel

| Documento | Resposta observada | Tratamento |
| --- | --- | --- |
| Nível do usuário sem nome exato de campo | O campo retornado é nivel | Binding configurado para nivel. |
| Saldo/créditos sem schema completo | /account/balance retorna balance e bonus | Adaptador de saldo e bônus configurado. Não se presume saldo sacável. |
| GET /api/online/informations | HTTP 405, Allow: PUT | GET não foi trocado por uma gravação silenciosa; PUT consta como operação observada separada. |
| GET /api/online/withdrawal-data | HTTP 405, Allow: PUT | Mesmo tratamento; nenhum PUT foi executado para “consultar”. |
| POST /api/online/can-withdraw | HTTP 405; GET retorna 200 | GET adicionado como operação observada e usado na leitura de elegibilidade. |
| Elegibilidade sem retorno completo | GET retorna can_request: can-request nesta conta | Ainda falta contrato completo dos bloqueios/rollover e da solicitação de saque. |
| Nomes genéricos de limites no guia | O tenant retorna também campos prematch_* | Aliases de configuração normalizados para o bilhete. |
| Histórico sem schema completo | Listagem não contém seleções; comprovante contém hunches | Comprovantes são consultados para preencher os cards. |
| Comprovante com dinheiro em string | Há texto monetário formatado e campos numéricos *_value | Usados os campos numéricos no adaptador. |
| Limites de saque | Mínimo de 10.000 e máximo de 1.000 na configuração consultada | Não corrigidos pelo frontend; uma solicitação fora dos limites é bloqueada. |

As três variantes de método observadas estão em src/lib/backoffice/observed.ts, separadas das 104 operações originais. Não foram inferidos payloads de atualização a partir de um cabeçalho Allow.

## O que continua pendente

### Operações financeiras e cadastro

Estes fluxos possuem transporte/gateway, mas **não estão liberados para uma operação real completa**:

- Cadastro: matriz register_mode → endpoint e campos obrigatórios.
- Troca de senha: nomes dos campos, validação e confirmação da resposta.
- Registro de aposta: payload completo, identificadores, confirmação de sucesso e revisão de up_price.
- Criar Aposta: endpoint/contrato de cotação correlacionada e registro das pernas. /api/builder não foi tratado como cotador.
- Depósito: campos de ID/QR/copia-e-cola e contrato de confirmação do pagamento.
- Saque: payload completo da chave Pix, edição e confirmação da solicitação, além dos estados de elegibilidade.
- Cashout: evento/payload/validade da oferta e campos de confirmação.
- Execução real de jogo do cassino: payload e retorno de games-url. O demonstrador local não movimenta créditos reais.

Não foram inventados nomes de campos para completar esses contratos. A operação correspondente só pode ser habilitada após preencher bindings confirmados. Configurar o host e conseguir fazer login não prova que esses fluxos financeiros já estão concluídos.

### Funcionalidades sem contrato suficiente

- Recuperação de senha, contato/endereço, sessões/dispositivos e limites pessoais.
- Recompensas/freebets/promoções e código promocional no depósito.
- Cancelamento online do jogador: a rota disponível no guia é de cambista.
- Estatísticas avançadas/escalação/cronologia/tabela.
- Bundles promocionais específicos da captura, diferentes de boost percentual por odd.
- Categorias e provedores do cassino ainda sem IDs correspondentes aos slugs atuais. As categorias sem mapeamento não usam um filtro inventado.
- Filtros remotos de status do histórico esportivo; as abas atuais filtram os bilhetes da página retornada.

### Funcionalidades que exigem módulos/telas novos

Cambista, Tradicional, Loterias, 2 Para 500, raspadinhas e editor de tema estão no catálogo de transporte, mas não ganharam interfaces novas, respeitando a restrição de layout. raffle, sweepstake, crypto e arena continuam sem contratos de ação no documento.

### Tempo real

O painel foi observado com margem geral e margens de mercados ao vivo em zero. Enquanto a fórmula de margem não for documentada, o adaptador não calcula uma cotação financeira por suposição: se encontrar margem diferente de zero, mantém o acompanhamento e não libera esses preços.

Foram conectados os eventos da grade. A assinatura específica join:event/event:update, os contadores globais e o conteúdo completo do painel estatístico ainda precisam de integração/validação nos respectivos pontos atuais.

## Organização do código

- src/lib/backoffice/catalogue.ts: catálogo das 104 operações.
- src/lib/backoffice/client.ts: transporte do navegador e chamada por ID de operação.
- src/lib/backoffice/*-source.ts: fontes de dados que alimentam os componentes existentes.
- src/lib/backoffice/public-adapters.ts: schemas públicos e de comprovante observados neste tenant.
- src/server/backoffice/: tenant, sessão, transporte, adaptadores, configuração e gateway de ações.
- src/app/api/backoffice/: proxy autorizado.
- src/app/api/session/: sessão pública normalizada sem JWT.
- src/app/api/actions/: adaptação dos eventos dos formulários atuais.
- src/app/api/resources/: histórico/extrato, regulamento sanitizado e recursos adaptados.
- config/*.example.json e .env.example: modelos de configuração sem credenciais.

Os bindings são locais ao servidor. Templates usam referências como $amount a valores recebidos da UI; nomes e métodos do backend precisam ser confirmados antes da configuração. As operações configuráveis são limitadas aos endpoints correspondentes, para não transformar um binding de senha em outra ação por engano.

## Verificação

    npm run typecheck
    npm run test:backoffice
    npm run check:backoffice
    npm run test:demo
    npm run build

check:backoffice consulta o ambiente, grade, cassino, regulamento, sessão, saldo, histórico, comprovante e extrato. Com as variáveis privadas de teste preenchidas, faz login e logout da própria sessão. Não gera Pix, solicita saque, registra aposta, aceita cashout, cria conta ou altera perfil.

test:demo executa os testes anteriores em outra porta e outro diretório de build, com BACKOFFICE_MODE=demo, sem chamar o backoffice real.

Os resultados são registrados em evidence/local; arquivos autenticados desta etapa são ignorados pelo controle de versão.
