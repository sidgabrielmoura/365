# Situação por operação após a etapa inicial

Transporte não equivale a uma função concluída na interface. As classificações abaixo mostram a situação de cada uma das 104 operações documentadas.

| ID | Método/endpoint | Transporte | Situação na interface |
| --- | --- | --- | --- |
| API-001 | POST /bet/login | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-002 | POST /api/auth-logout | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-003 | POST /api/v3/online/auth | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-004 | POST /api/auth | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-005 | POST /api/online/register | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-006 | POST /api/online/v2/register | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-007 | POST /api/online/v3/register | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-008 | GET /api/online/account/balance | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-009 | GET /api/online/informations | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-010 | GET /api/online/withdrawal-data | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-011 | PUT /api/online/change-pasword | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-012 | POST /api/online/refer-win-code | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-013 | GET /api/refer-and-win-rules | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-014 | GET /api/online/transactions?page&per_page=15 | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-015 | GET /api/online/deposits?page&per_page=15 | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-016 | GET /api/online/withdrawals?page&per_page=15 | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-017 | GET /api/online/casino-plays?page&per_page=15 | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-018 | GET /api/online/config | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-019 | GET /api/regulamento | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-020 | GET /api/live-settings | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-021 | POST /api/builder | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-022 | GET /api/v3/app/grid-events/{segment}/{sport_id} | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-023 | GET /api/v3/user/grid-events/{segment}/{sport_id} | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-024 | POST /api/bet/v3/event/{id} | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-025 | GET /api/v3/app/event-odds/{id}?category= | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-026 | GET /api/v3/user/event-odds/{id}?category= | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-027 | GET /api/v1/featured/events | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-028 | GET /api/v1/featured/user/events | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-029 | GET /api/v1/featured/boosted-events | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-030 | GET /api/v1/featured/user/boosted-events | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-031 | GET /api/main-leagues?sport_id= | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-032 | GET /api/leagues-default-grouped | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-033 | POST /api/search-events | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-034 | GET /api/v1/winners | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-035 | POST /api/featured-tickets | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-036 | POST /api/featured-tickets/{hash} | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-037 | POST /api/online/register-bet | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-038 | POST /api/seller/register-bet | Implementado | Sem tela atual; não foi criada interface nova |
| API-039 | POST /api/register-pre-bet | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-040 | GET /api/status-payment | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-041 | POST /api/tickets/bet/{id} | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-042 | GET /api/shared-ticket/{id} | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-043 | GET /api/online/history/bets | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-044 | GET /api/online/quantity-opened-bets | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-045 | POST /api/online/cashout/keep-alive/{ticket_id} | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-046 | POST /api/online/cashout/confirm | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-047 | GET /api/online/cashout/ably-token | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-048 | POST /api/online/deposits | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-049 | GET /api/check-payment | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-050 | POST /api/online/can-withdraw | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-051 | POST /api/online/withdrawals | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-052 | GET /api/bilhetes | Implementado | Sem tela atual; não foi criada interface nova |
| API-053 | GET /api/cancela-bilhete/{id} | Implementado | Sem tela atual; não foi criada interface nova |
| API-054 | GET /api/traditional/tickets | Implementado | Sem tela atual; não foi criada interface nova |
| API-055 | GET /api/lottery/tickets | Implementado | Sem tela atual; não foi criada interface nova |
| API-056 | POST /api/seller/get-report | Implementado | Sem tela atual; não foi criada interface nova |
| API-057 | GET /api/seller/current-balances | Implementado | Sem tela atual; não foi criada interface nova |
| API-058 | GET /api/seller/cashier | Implementado | Sem tela atual; não foi criada interface nova |
| API-059 | GET /api/seller/clients | Implementado | Sem tela atual; não foi criada interface nova |
| API-060 | POST /api/seller/clients | Implementado | Sem tela atual; não foi criada interface nova |
| API-061 | DELETE /api/clientes/{id} | Implementado | Sem tela atual; não foi criada interface nova |
| API-062 | PUT /api/seller/change-password | Implementado | Sem tela atual; não foi criada interface nova |
| API-063 | POST /api/seller/get-pre-ticket/{pin} | Implementado | Sem tela atual; não foi criada interface nova |
| API-064 | POST /api/traditional/settings | Implementado | Sem tela atual; não foi criada interface nova |
| API-065 | GET /api/seller/traditional/settings | Implementado | Sem tela atual; não foi criada interface nova |
| API-066 | GET /api/traditional/v3/lotteries?date&grouped=1 | Implementado | Sem tela atual; não foi criada interface nova |
| API-067 | GET /api/traditional/auth/v3/lotteries?date&grouped=1 | Implementado | Sem tela atual; não foi criada interface nova |
| API-068 | POST /api/traditional/v3/modalities | Implementado | Sem tela atual; não foi criada interface nova |
| API-069 | GET /api/traditional/auth/v3/modalities?lottery= | Implementado | Sem tela atual; não foi criada interface nova |
| API-070 | POST /api/online/traditional/register-ticket | Implementado | Sem tela atual; não foi criada interface nova |
| API-071 | POST /api/seller-tradicional/register-bet | Implementado | Sem tela atual; não foi criada interface nova |
| API-072 | POST /api/traditional/pre-ticket | Implementado | Sem tela atual; não foi criada interface nova |
| API-073 | POST /api/seller/traditional/get-pin | Implementado | Sem tela atual; não foi criada interface nova |
| API-074 | POST /api/seller/traditional/validate-pin | Implementado | Sem tela atual; não foi criada interface nova |
| API-075 | GET /api/online/traditional/bets | Implementado | Sem tela atual; não foi criada interface nova |
| API-076 | POST /api/tickets/traditional | Implementado | Sem tela atual; não foi criada interface nova |
| API-077 | GET /api/online/loto | Implementado | Sem tela atual; não foi criada interface nova |
| API-078 | GET /api/seller/loto | Implementado | Sem tela atual; não foi criada interface nova |
| API-079 | GET /api/loto/settings | Implementado | Sem tela atual; não foi criada interface nova |
| API-080 | GET /api/loto/availables-loto | Implementado | Sem tela atual; não foi criada interface nova |
| API-081 | GET /api/loto/{id}/details | Implementado | Sem tela atual; não foi criada interface nova |
| API-082 | GET /api/loto/{id}/contests | Implementado | Sem tela atual; não foi criada interface nova |
| API-083 | POST /api/online/loto/register-bet | Implementado | Sem tela atual; não foi criada interface nova |
| API-084 | POST /api/seller/loto/register-bet | Implementado | Sem tela atual; não foi criada interface nova |
| API-085 | POST /api/loto/register-pre-bet | Implementado | Sem tela atual; não foi criada interface nova |
| API-086 | POST /api/seller/loto/validate-pin | Implementado | Sem tela atual; não foi criada interface nova |
| API-087 | POST /api/loto/2p500/contests | Implementado | Sem tela atual; não foi criada interface nova |
| API-088 | POST /api/seller/loto/2p500-contests | Implementado | Sem tela atual; não foi criada interface nova |
| API-089 | POST /api/loto/2p500/random-hunch | Implementado | Sem tela atual; não foi criada interface nova |
| API-090 | GET /api/online/loto/bets | Implementado | Sem tela atual; não foi criada interface nova |
| API-091 | POST /api/tickets/loto | Implementado | Sem tela atual; não foi criada interface nova |
| API-092 | GET /api/casino/home-categories | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-093 | GET /api/casino/providers | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-094 | GET /api/casino/available-games?categories[]&providers[]&filter_q&page&per_page | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-095 | GET /api/casino/game/{reference} | Implementado | Ligação aos componentes atuais (leitura/autenticação; ver limitações no relatório) |
| API-096 | POST /api/casino/games-url | Implementado | Gateway/binding preparado; ação não liberada sem contrato confirmado |
| API-097 | POST /api/casino/games-content | Implementado | Transporte disponível; ligação/validação do fluxo pendente |
| API-098 | GET /api/scratch-cards/list | Implementado | Sem tela atual; não foi criada interface nova |
| API-099 | GET /api/scratch-cards/{slug}/details | Implementado | Sem tela atual; não foi criada interface nova |
| API-100 | POST /api/online/scratch-cards/buy | Implementado | Sem tela atual; não foi criada interface nova |
| API-101 | POST /api/scratch-cards/free-buy | Implementado | Sem tela atual; não foi criada interface nova |
| API-102 | GET /api/site/validate-theme-builder?token= | Implementado | Sem tela atual; não foi criada interface nova |
| API-103 | GET /api/site/themes | Implementado | Sem tela atual; não foi criada interface nova |
| API-104 | POST /api/site/save-theme-color | Implementado | Sem tela atual; não foi criada interface nova |

Diferenças reais de método, resultados e pendências estão em [integracao-backoffice.md](integracao-backoffice.md).
