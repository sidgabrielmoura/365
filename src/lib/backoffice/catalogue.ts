// Operation catalogue from layout-betano-backend-api.md. Stable IDs retain the original mapping.
export const operations = [
  {
    "id": "API-001",
    "method": "POST",
    "path": "/bet/login",
    "auth": "public",
    "mutation": true,
    "sourceLine": 89
  },
  {
    "id": "API-002",
    "method": "POST",
    "path": "/api/auth-logout",
    "auth": "authenticated",
    "mutation": true,
    "sourceLine": 132
  },
  {
    "id": "API-003",
    "method": "POST",
    "path": "/api/v3/online/auth",
    "auth": "online",
    "mutation": true,
    "sourceLine": 142
  },
  {
    "id": "API-004",
    "method": "POST",
    "path": "/api/auth",
    "auth": "authenticated",
    "mutation": true,
    "sourceLine": 132
  },
  {
    "id": "API-005",
    "method": "POST",
    "path": "/api/online/register",
    "auth": "public",
    "mutation": true,
    "sourceLine": 210
  },
  {
    "id": "API-006",
    "method": "POST",
    "path": "/api/online/v2/register",
    "auth": "public",
    "mutation": true,
    "sourceLine": 247
  },
  {
    "id": "API-007",
    "method": "POST",
    "path": "/api/online/v3/register",
    "auth": "public",
    "mutation": true,
    "sourceLine": 277
  },
  {
    "id": "API-008",
    "method": "GET",
    "path": "/api/online/account/balance",
    "auth": "online",
    "mutation": false,
    "sourceLine": 306
  },
  {
    "id": "API-009",
    "method": "PUT",
    "path": "/api/online/informations",
    "auth": "online",
    "mutation": true,
    "sourceLine": 320
  },
  {
    "id": "API-010",
    "method": "PUT",
    "path": "/api/online/withdrawal-data",
    "auth": "online",
    "mutation": true,
    "sourceLine": 341
  },
  {
    "id": "API-011",
    "method": "PUT",
    "path": "/api/online/change-pasword",
    "auth": "online",
    "mutation": true,
    "sourceLine": 363
  },
  {
    "id": "API-012",
    "method": "POST",
    "path": "/api/online/refer-win-code",
    "auth": "online",
    "mutation": true,
    "sourceLine": 385
  },
  {
    "id": "API-013",
    "method": "GET",
    "path": "/api/refer-and-win-rules",
    "auth": "authenticated",
    "mutation": false,
    "sourceLine": 401
  },
  {
    "id": "API-014",
    "method": "GET",
    "path": "/api/online/transactions",
    "auth": "online",
    "mutation": false,
    "sourceLine": 80
  },
  {
    "id": "API-015",
    "method": "GET",
    "path": "/api/online/deposits",
    "auth": "online",
    "mutation": false,
    "sourceLine": 80
  },
  {
    "id": "API-016",
    "method": "GET",
    "path": "/api/online/withdrawals",
    "auth": "online",
    "mutation": false,
    "sourceLine": 80
  },
  {
    "id": "API-017",
    "method": "GET",
    "path": "/api/online/casino-plays",
    "auth": "online",
    "module": "casino",
    "mutation": false,
    "sourceLine": 80
  },
  {
    "id": "API-018",
    "method": "GET",
    "path": "/api/online/config",
    "auth": "public",
    "mutation": false,
    "sourceLine": 476
  },
  {
    "id": "API-019",
    "method": "GET",
    "path": "/api/regulamento",
    "auth": "public",
    "mutation": false,
    "sourceLine": 500
  },
  {
    "id": "API-020",
    "method": "GET",
    "path": "/api/live-settings",
    "auth": "public",
    "mutation": false,
    "sourceLine": 514
  },
  {
    "id": "API-021",
    "method": "POST",
    "path": "/api/builder",
    "auth": "public",
    "module": "bet-builder",
    "mutation": true,
    "sourceLine": 541
  },
  {
    "id": "API-022",
    "method": "GET",
    "path": "/api/v3/app/grid-events/{segment}/{sport_id}",
    "auth": "public",
    "module": "bet",
    "mutation": false,
    "sourceLine": 606
  },
  {
    "id": "API-023",
    "method": "GET",
    "path": "/api/v3/user/grid-events/{segment}/{sport_id}",
    "auth": "authenticated",
    "module": "bet",
    "mutation": false,
    "sourceLine": 606
  },
  {
    "id": "API-024",
    "method": "POST",
    "path": "/api/bet/v3/event/{id}",
    "auth": "public",
    "mutation": true,
    "sourceLine": 684
  },
  {
    "id": "API-025",
    "method": "GET",
    "path": "/api/v3/app/event-odds/{id}",
    "auth": "public",
    "module": "bet",
    "mutation": false,
    "sourceLine": 732
  },
  {
    "id": "API-026",
    "method": "GET",
    "path": "/api/v3/user/event-odds/{id}",
    "auth": "authenticated",
    "module": "bet",
    "mutation": false,
    "sourceLine": 732
  },
  {
    "id": "API-027",
    "method": "GET",
    "path": "/api/v1/featured/events",
    "auth": "public",
    "mutation": false,
    "sourceLine": 790
  },
  {
    "id": "API-028",
    "method": "GET",
    "path": "/api/v1/featured/user/events",
    "auth": "authenticated",
    "mutation": false,
    "sourceLine": 790
  },
  {
    "id": "API-029",
    "method": "GET",
    "path": "/api/v1/featured/boosted-events",
    "auth": "public",
    "mutation": false,
    "sourceLine": 848
  },
  {
    "id": "API-030",
    "method": "GET",
    "path": "/api/v1/featured/user/boosted-events",
    "auth": "authenticated",
    "mutation": false,
    "sourceLine": 848
  },
  {
    "id": "API-031",
    "method": "GET",
    "path": "/api/main-leagues",
    "auth": "public",
    "mutation": false,
    "sourceLine": 905
  },
  {
    "id": "API-032",
    "method": "GET",
    "path": "/api/leagues-default-grouped",
    "auth": "public",
    "mutation": false,
    "sourceLine": 940
  },
  {
    "id": "API-033",
    "method": "POST",
    "path": "/api/search-events",
    "auth": "public",
    "mutation": true,
    "sourceLine": 978
  },
  {
    "id": "API-034",
    "method": "GET",
    "path": "/api/v1/winners",
    "auth": "public",
    "mutation": false,
    "sourceLine": 1022
  },
  {
    "id": "API-035",
    "method": "POST",
    "path": "/api/featured-tickets",
    "auth": "public",
    "mutation": true,
    "sourceLine": 1076
  },
  {
    "id": "API-036",
    "method": "POST",
    "path": "/api/featured-tickets/{hash}",
    "auth": "public",
    "mutation": true,
    "sourceLine": 1133
  },
  {
    "id": "API-037",
    "method": "POST",
    "path": "/api/online/register-bet",
    "auth": "online",
    "module": "bet",
    "mutation": true,
    "sourceLine": 1207
  },
  {
    "id": "API-038",
    "method": "POST",
    "path": "/api/seller/register-bet",
    "auth": "seller",
    "module": "bet",
    "mutation": true,
    "sourceLine": 1265
  },
  {
    "id": "API-039",
    "method": "POST",
    "path": "/api/register-pre-bet",
    "auth": "public",
    "mutation": true,
    "sourceLine": 1318
  },
  {
    "id": "API-040",
    "method": "POST",
    "path": "/api/status-payment",
    "auth": "public",
    "mutation": true,
    "sourceLine": 1367
  },
  {
    "id": "API-041",
    "method": "POST",
    "path": "/api/tickets/bet/{id}",
    "auth": "public",
    "mutation": true,
    "sourceLine": 1385
  },
  {
    "id": "API-042",
    "method": "GET",
    "path": "/api/shared-ticket/{id}",
    "auth": "public",
    "mutation": false,
    "sourceLine": 1446
  },
  {
    "id": "API-043",
    "method": "GET",
    "path": "/api/online/history/bets",
    "auth": "online",
    "mutation": false,
    "sourceLine": 1511
  },
  {
    "id": "API-044",
    "method": "GET",
    "path": "/api/online/quantity-opened-bets",
    "auth": "online",
    "mutation": false,
    "sourceLine": 1547
  },
  {
    "id": "API-045",
    "method": "POST",
    "path": "/api/online/cashout/keep-alive/{ticket_id}",
    "auth": "online",
    "module": "cashout",
    "mutation": true,
    "sourceLine": 1555
  },
  {
    "id": "API-046",
    "method": "POST",
    "path": "/api/online/cashout/confirm",
    "auth": "online",
    "module": "cashout",
    "mutation": true,
    "sourceLine": 1568
  },
  {
    "id": "API-047",
    "method": "GET",
    "path": "/api/online/cashout/ably-token",
    "auth": "online",
    "module": "cashout",
    "mutation": false,
    "sourceLine": 1606
  },
  {
    "id": "API-048",
    "method": "POST",
    "path": "/api/online/deposits",
    "auth": "online",
    "mutation": true,
    "sourceLine": 1641
  },
  {
    "id": "API-049",
    "method": "POST",
    "path": "/api/check-payment",
    "auth": "online",
    "mutation": true,
    "sourceLine": 1676
  },
  {
    "id": "API-050",
    "method": "GET",
    "path": "/api/online/can-withdraw",
    "auth": "online",
    "mutation": false,
    "sourceLine": 1694
  },
  {
    "id": "API-051",
    "method": "POST",
    "path": "/api/online/withdrawals",
    "auth": "online",
    "mutation": true,
    "sourceLine": 1709
  },
  {
    "id": "API-052",
    "method": "GET",
    "path": "/api/bilhetes",
    "auth": "seller",
    "mutation": false,
    "sourceLine": 1757
  },
  {
    "id": "API-053",
    "method": "GET",
    "path": "/api/cancela-bilhete/{id}",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1794
  },
  {
    "id": "API-054",
    "method": "GET",
    "path": "/api/traditional/tickets",
    "auth": "seller",
    "module": "traditional",
    "mutation": false,
    "sourceLine": 1810
  },
  {
    "id": "API-055",
    "method": "GET",
    "path": "/api/lottery/tickets",
    "auth": "seller",
    "module": "loto",
    "mutation": false,
    "sourceLine": 1846
  },
  {
    "id": "API-056",
    "method": "POST",
    "path": "/api/seller/get-report",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1856
  },
  {
    "id": "API-057",
    "method": "GET",
    "path": "/api/seller/current-balances",
    "auth": "seller",
    "mutation": false,
    "sourceLine": 1888
  },
  {
    "id": "API-058",
    "method": "GET",
    "path": "/api/seller/cashier",
    "auth": "seller",
    "mutation": false,
    "sourceLine": 1906
  },
  {
    "id": "API-059",
    "method": "GET",
    "path": "/api/seller/clients",
    "auth": "seller",
    "mutation": false,
    "sourceLine": 1939
  },
  {
    "id": "API-060",
    "method": "POST",
    "path": "/api/seller/clients",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1939
  },
  {
    "id": "API-061",
    "method": "DELETE",
    "path": "/api/clientes/{id}",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1963
  },
  {
    "id": "API-062",
    "method": "PUT",
    "path": "/api/seller/change-password",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1978
  },
  {
    "id": "API-063",
    "method": "POST",
    "path": "/api/seller/get-pre-ticket/{pin}",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1999
  },
  {
    "id": "API-064",
    "method": "POST",
    "path": "/api/traditional/settings",
    "auth": "public",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2067
  },
  {
    "id": "API-065",
    "method": "GET",
    "path": "/api/seller/traditional/settings",
    "auth": "seller",
    "module": "traditional",
    "mutation": false,
    "sourceLine": 2100
  },
  {
    "id": "API-066",
    "method": "GET",
    "path": "/api/traditional/v3/lotteries",
    "auth": "public",
    "module": "traditional",
    "mutation": false,
    "sourceLine": 2119
  },
  {
    "id": "API-067",
    "method": "GET",
    "path": "/api/traditional/auth/v3/lotteries",
    "auth": "authenticated",
    "module": "traditional",
    "mutation": false,
    "sourceLine": 2158
  },
  {
    "id": "API-068",
    "method": "POST",
    "path": "/api/traditional/v3/modalities",
    "auth": "public",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2169
  },
  {
    "id": "API-069",
    "method": "GET",
    "path": "/api/traditional/auth/v3/modalities",
    "auth": "authenticated",
    "module": "traditional",
    "mutation": false,
    "sourceLine": 2206
  },
  {
    "id": "API-070",
    "method": "POST",
    "path": "/api/online/traditional/register-ticket",
    "auth": "online",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2220
  },
  {
    "id": "API-071",
    "method": "POST",
    "path": "/api/seller-tradicional/register-bet",
    "auth": "seller",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2274
  },
  {
    "id": "API-072",
    "method": "POST",
    "path": "/api/traditional/pre-ticket",
    "auth": "public",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2309
  },
  {
    "id": "API-073",
    "method": "POST",
    "path": "/api/seller/traditional/get-pin",
    "auth": "seller",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2350
  },
  {
    "id": "API-074",
    "method": "POST",
    "path": "/api/seller/traditional/validate-pin",
    "auth": "seller",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2386
  },
  {
    "id": "API-075",
    "method": "GET",
    "path": "/api/online/traditional/bets",
    "auth": "online",
    "module": "traditional",
    "mutation": false,
    "sourceLine": 2412
  },
  {
    "id": "API-076",
    "method": "POST",
    "path": "/api/tickets/traditional",
    "auth": "public",
    "module": "traditional",
    "mutation": true,
    "sourceLine": 2438
  },
  {
    "id": "API-077",
    "method": "GET",
    "path": "/api/online/loto/lotteries",
    "auth": "online",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2518
  },
  {
    "id": "API-078",
    "method": "GET",
    "path": "/api/seller/loto/lotteries",
    "auth": "seller",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2518
  },
  {
    "id": "API-079",
    "method": "GET",
    "path": "/api/loto/settings",
    "auth": "public",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2535
  },
  {
    "id": "API-080",
    "method": "GET",
    "path": "/api/loto/availables-loto",
    "auth": "public",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2518
  },
  {
    "id": "API-081",
    "method": "GET",
    "path": "/api/loto/{id}/details",
    "auth": "public",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2567
  },
  {
    "id": "API-082",
    "method": "GET",
    "path": "/api/loto/{id}/contests",
    "auth": "public",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2595
  },
  {
    "id": "API-083",
    "method": "POST",
    "path": "/api/online/loto/register-bet",
    "auth": "online",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2613
  },
  {
    "id": "API-084",
    "method": "POST",
    "path": "/api/seller/loto/register-bet",
    "auth": "seller",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2665
  },
  {
    "id": "API-085",
    "method": "POST",
    "path": "/api/loto/register-pre-bet",
    "auth": "public",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2678
  },
  {
    "id": "API-086",
    "method": "POST",
    "path": "/api/seller/loto/validate-pin",
    "auth": "seller",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2707
  },
  {
    "id": "API-087",
    "method": "POST",
    "path": "/api/loto/2p500/contests",
    "auth": "public",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2733
  },
  {
    "id": "API-088",
    "method": "GET",
    "path": "/api/seller/loto/2p500-contests",
    "auth": "seller",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2733
  },
  {
    "id": "API-089",
    "method": "POST",
    "path": "/api/loto/2p500/random-hunch",
    "auth": "public",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2766
  },
  {
    "id": "API-090",
    "method": "GET",
    "path": "/api/online/loto/bets",
    "auth": "online",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2783
  },
  {
    "id": "API-091",
    "method": "POST",
    "path": "/api/tickets/loto",
    "auth": "public",
    "module": "loto",
    "mutation": true,
    "sourceLine": 2805
  },
  {
    "id": "API-092",
    "method": "GET",
    "path": "/api/casino/home-categories",
    "auth": "public",
    "module": "casino",
    "mutation": false,
    "sourceLine": 2851
  },
  {
    "id": "API-093",
    "method": "GET",
    "path": "/api/casino/providers",
    "auth": "public",
    "module": "casino",
    "mutation": false,
    "sourceLine": 2875
  },
  {
    "id": "API-094",
    "method": "GET",
    "path": "/api/casino/available-games",
    "auth": "public",
    "module": "casino",
    "mutation": false,
    "sourceLine": 2889
  },
  {
    "id": "API-095",
    "method": "GET",
    "path": "/api/casino/game/{reference}",
    "auth": "public",
    "module": "casino",
    "mutation": false,
    "sourceLine": 2917
  },
  {
    "id": "API-096",
    "method": "POST",
    "path": "/api/casino/games-url",
    "auth": "online",
    "module": "casino",
    "mutation": true,
    "sourceLine": 2934
  },
  {
    "id": "API-097",
    "method": "POST",
    "path": "/api/casino/games-content",
    "auth": "public",
    "module": "casino",
    "mutation": true,
    "sourceLine": 2958
  },
  {
    "id": "API-098",
    "method": "GET",
    "path": "/api/scratch-cards/list",
    "auth": "public",
    "module": "scratchcard",
    "mutation": false,
    "sourceLine": 2972
  },
  {
    "id": "API-099",
    "method": "GET",
    "path": "/api/scratch-cards/{slug}/details",
    "auth": "public",
    "module": "scratchcard",
    "mutation": false,
    "sourceLine": 224
  },
  {
    "id": "API-100",
    "method": "POST",
    "path": "/api/online/scratch-cards/buy",
    "auth": "authenticated",
    "module": "scratchcard",
    "mutation": true,
    "sourceLine": 3005
  },
  {
    "id": "API-101",
    "method": "POST",
    "path": "/api/scratch-cards/free-buy",
    "auth": "public",
    "module": "scratchcard",
    "mutation": true,
    "sourceLine": 3005
  },
  {
    "id": "API-102",
    "method": "GET",
    "path": "/api/site/validate-theme-builder",
    "auth": "editor",
    "mutation": false,
    "sourceLine": 3049
  },
  {
    "id": "API-104",
    "method": "POST",
    "path": "/api/site/save-theme-color",
    "auth": "editor",
    "mutation": true,
    "sourceLine": 3067
  },
  {
    "id": "API-105",
    "method": "GET",
    "path": "/api/online/loto/settings",
    "auth": "online",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2535
  },
  {
    "id": "API-106",
    "method": "GET",
    "path": "/api/seller/loto/settings",
    "auth": "seller",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2535
  },
  {
    "id": "API-107",
    "method": "GET",
    "path": "/api/online/loto/details",
    "auth": "online",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2567
  },
  {
    "id": "API-108",
    "method": "GET",
    "path": "/api/seller/loto/details",
    "auth": "seller",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2567
  },
  {
    "id": "API-109",
    "method": "GET",
    "path": "/api/online/loto/contests",
    "auth": "online",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2595
  },
  {
    "id": "API-110",
    "method": "GET",
    "path": "/api/seller/loto/contests",
    "auth": "seller",
    "module": "loto",
    "mutation": false,
    "sourceLine": 2595
  },
  {
    "id": "API-111",
    "method": "DELETE",
    "path": "/api/seller/clients/{id}",
    "auth": "seller",
    "mutation": true,
    "sourceLine": 1963
  }
] as const;
export type OperationId = typeof operations[number]["id"];
