# Registro de inspeção

Alvo: `https://brasabetbr.com/`. Captura e reconstrução em 18/11/2026.

## REA instalado

Foi utilizado o `capture-browser-scenario` do REA instalado em `C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs`, com Chrome local. O CLI foi usado após o transporte do conector MCP deixar de responder.

| Evidência | Conteúdo |
| --- | --- |
| `ev_d8d6e5c4d85b6fbba0f3b67eb47665e928e75e02942192b34081009a4f9d5422` | Home, DOM, mídia, estilos e respostas públicas |
| `ev_9c6af1c6ef8c7703a2d247f068946a20c81de2c27b52c15009b56b00abb15907` | Acesso autenticado, menu de conta, abas Pix e rascunho do bilhete |
| `ev_efafb23dafa7709bf0c9956313b8602418fcad3b3182f3c9f2a749183d4aa79d` | Ao vivo, partida, basquete, tênis e futebol americano |
| `ev_f3e79853ffda924b907c227acf40ff9801d2fc583d1510a69b434abdf8029528` | Cadastro, navegação pública, partida e recompensas |
| `ev_1667f96a32f92095dfbc8051ba6160c4643117679519fbb474e72e5ca8a00e44` | Aba Criar Aposta e organização dos mercados |
| `ev_e96d071709d2c37db680f9b0f7dae9bc7d5b30e5c609bb25ded3499aba19a91f` | Banco, contato, senha, endereço, preferências, aparelhos e indicação |

As ações autenticadas foram de consulta e seleção de rascunho. As simulações de saldo e aposta foram implementadas no clone. As capturas autenticadas permanecem excluídas do Git. A coleta de respostas públicas complementares está separada em `supplemental-public-data.json` e `supplemental-live-data.json`.

Algumas capturas do REA atingiram o orçamento de eventos de rede, e uma captura do cassino mostrou o estado de carregamento. A referência do cassino carregado é `brasa-original-casino.html/.png`, produzida pela captura anterior do REA. Os limites registrados nos envelopes não sustentam uma alegação de cobertura total do site.

## Comparação visual

Foram inspecionadas as seis imagens enviadas: home sem acesso, home conectada, depósito Pix, saque Pix, menu da conta e recompensas. As imagens locais estão em `local`. Capturas adicionais cobrem partida, ao vivo, cassino e versões móveis.

A escala das imagens enviadas difere das capturas de CSS pixels do REA. A inspeção local inclui capturas a 1920 CSS pixels com escala 1,25 e a 390 pixels em dispositivos móveis. Não foi atribuído um percentual numérico de similaridade.

## Verificações automatizadas

Os testes em `tests/flows.spec.ts` cobrem saldo, idempotência, preços canônicos, cancelamento, cashout, cadastro, acesso persistente, Criar Aposta, cassino, busca, paginação, favoritos ao vivo, rotas físicas e alterações de conta. O relatório da execução fica em `local/test-results.json`. O resultado final de compilação e contagens de rotas é registrado em `local/final-checks.json`.

## Correção do modal Estat.

A captura REA `ev_4a1a9cac8af1ce926f9b59fd945b96b91b5eb5cd53d845dabd1a4f3941823fce` confirmou o modal da partida Coritiba × Santos: título, mensagem de estatísticas indisponíveis e link Ver mercados. A implementação usa a estrutura `.information-page` e os estilos originais, incluindo o placar para eventos ao vivo.

As capturas corrigidas ficam em `local/event-stats-desktop.png` e `local/event-stats-mobile.png`. Os dois testes em `tests/event-stats.spec.ts` verificam abertura, fechamento, restauração de foco, navegação para a partida, placar ao vivo e adaptação móvel. Ambos passaram, assim como TypeScript e a compilação de produção. A medição local do modal de desktop foi de 440 × 217,28 CSS pixels, com fundo `#202020` e título de 24 px.

## Alinhamento de Minhas Apostas

A captura autenticada REA `ev_67c3beda1e884ca12d119d688c19e1be2a0f9cf23d20b04593bac08dcfa8d10d` registrou as abas Em Aberto, Ao-Vivo e Resolvidas, os estados vazios e a expansão de um bilhete existente. A inspeção foi somente de consulta; nenhum bilhete do site original foi criado, cancelado ou encerrado.

A página local agora usa a estrutura `.my-bets`, `.mb-tabs`, `.mb-empty`, `.mb-list` e `.mb-card` com os estilos públicos capturados. As abas usam links e mantêm o filtro na URL. Os cards locais expandem seleções e valores; o cashout mantém o fluxo de confirmação da referência. O cancelamento de demonstração permanece como ação secundária dentro do bilhete. O valor de cashout e os saldos continuam fictícios.

As capturas em `local/my-bets-empty.png`, `local/my-bets-collapsed.png`, `local/my-bets-expanded.png` e `local/my-bets-mobile-card.png` registram a versão corrigida. `tests/my-bets.spec.ts` verifica os textos, as três abas, persistência do filtro, expansão, classificação ao vivo, cashout e adaptação móvel. O relatório específico está em `local/my-bets-checks.json`.

O bilhete resolvido foi conferido em uma nova captura REA, `ev_c031e42a8612215f7374c6bf787f4e488d5bda6566cd9b92445b403d193161d6`, também somente de consulta. O card encerrado preserva a borda e o selo amarelos, o ícone de confirmação, os escudos dos times, o rótulo Retorno Total e a faixa Aposta Encerrada. As capturas locais estão em `local/my-bets-settled.png`, `local/my-bets-settled-content.png` e `local/my-bets-settled-mobile.png`; os valores exibidos pertencem à simulação local.

## Feedback após aposta e confirmação do Pix

O fluxo de aposta agora exibe somente o toast `Bilhete registrado.`, usando o estilo `#toast` do site original. O modal Aposta feita e o componente antigo de recibo foram removidos. A confirmação bem-sucedida continua atualizando o saldo e limpando o bilhete.

O painel Pix usa a estrutura e as animações `bcpx-result` recuperadas do JavaScript e CSS públicos retidos pelo REA. Ele mostra Depósito confirmado!, o valor pago, o texto do print, o botão Entendi e Fazer outro depósito. As abas ficam ocultas enquanto o resultado é mostrado. A animação respeita a preferência por movimento reduzido.

As capturas `local/pix-confirmed.png`, `local/pix-confirmed-mobile.png` e `local/bet-registered-toast.png` e o relatório `local/payment-feedback-checks.json` registram a verificação. `tests/wallet-result.spec.ts` confere o valor confirmado separadamente do saldo acumulado, a abertura de outro depósito, o foco, a animação e movimento reduzido. O teste de fluxo verifica o toast e a ausência de qualquer modal após a aposta.
