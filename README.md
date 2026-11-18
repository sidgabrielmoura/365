# BrasaBet — clone local

O projeto agora também possui um modo de integração com o backoffice. Consulte [a documentação da etapa inicial](docs/integracao-backoffice.md) para saber quais telas já usam dados reais, quais ações continuam bloqueadas por falta de contrato e como executar as verificações sem movimentar dinheiro. A estrutura visual e os estilos anteriores foram preservados.

Projeto em `C:\Users\gabriel\development\clones\bet365`, feito com Next.js App Router, React, TypeScript e Tailwind CSS. A interface foi reconstruída com capturas do site pelo REA instalado no computador, os arquivos públicos de estilo e mídia e as seis imagens de referência.

## Executar

Requer Node.js 24.15 ou superior, por causa do SQLite nativo.

```powershell
npm install
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000).

Para produção local:

```powershell
npm run build
npm start
```

## Explorar os fluxos

1. Clique em **Login → Explorar demonstração**, ou cadastre uma conta fictícia.
2. Clique no saldo, escolha um valor, **Gerar Pix → Simular pagamento**. O saldo fictício é salvo.
3. Selecione uma odd, informe o valor e clique em **Fazer aposta**. Confira o bilhete em **Minhas Apostas**.
4. Abra uma partida e escolha **Criar Aposta** para combinar mercados. Também há ofertas de Aposta Aumentada capturadas da referência.
5. Explore busca, filtros, favoritos ao vivo, categorias, provedores e paginação do cassino.

Contas, saldos, depósitos, saques, bilhetes e preferências ficam no banco `.local/demo.sqlite`. Os palpites ainda não enviados ficam no armazenamento do navegador. Senhas locais são armazenadas com scrypt; a sessão usa cookie HttpOnly.

## Páginas em pastas separadas

Cada tela tem seu `page.tsx` dentro de `src/app`. Não existe `[[...slug]]`.

| Tela | Pasta em `src/app` |
| --- | --- |
| Início | `page.tsx` |
| Ao vivo | `ao-vivo/page.tsx` |
| Próximos jogos | `proximos/page.tsx` |
| Esportes | `esportes/page.tsx` e uma pasta para cada modalidade |
| Partida | `evento/[id]/page.tsx` |
| Minhas Apostas | `minhas-apostas/page.tsx` |
| Conta e contato | `conta/page.tsx` |
| Endereço, senha, preferências, aparelhos e indicação | `conta/endereco`, `conta/senha`, `conta/preferencias`, `conta/aparelhos`, `conta/indique` |
| Banco | `conta/banco`, `conta/banco/depositar`, `conta/banco/sacar` |
| Histórico, atividade e controles | `conta/historico`, `conta/atividade`, `conta/controles` |
| Cassino | `cassino/page.tsx` |
| Categorias do cassino | `cassino/ao-vivo`, `novidades`, `slots`, `mesa-e-cartas`, `arcade`, `jackpots`, `todos` |
| Provedor e jogo | `cassino/provedor/[id]`, `cassino/jogo/[id]` |
| Recompensas | `recompensas/page.tsx` |
| Ajuda e informações | `ajuda`, `jogo-responsavel`, `app`, `termos`, `privacidade` |

`[id]` representa somente o identificador de um recurso. As páginas importam componentes compartilhados de `src/components`, evitando repetir cabeçalho, navegação, cards, formulários, bilhete e carteira.

## Paginação e dados

- Esportes: 12 partidas por página, com `?pagina=2&liga=...`.
- Cassino: 24 jogos por página, com `?pagina=2&q=...`; o filtro de provedor faz parte da rota.
- Abas da home: `?tab=nba`, `?tab=tennis` e equivalentes.
- Ao vivo: `?esporte=tennis`, `?esporte=favorites` e equivalentes.
- Minhas Apostas: `/minhas-apostas`, `?tab=live` e `?tab=settled`; listas maiores usam `?pagina=2`.

Os componentes `Pagination`, `MatchCard`, `Odd`, `GameCard` e `Workspace` são reutilizados pelas telas correspondentes. A biblioteca contém 7.369 registros de jogos, 404 partidas capturadas e uma captura com 59 eventos ao vivo. Esses dados são snapshots, sem atualização de placares ou odds em tempo real.

Logos, fontes, banners e imagens principais estão em `public/assets`. As imagens adicionais do catálogo são buscadas pelo servidor em um host de imagens permitido e guardadas em `.local/casino-images` no primeiro acesso. Imagens indisponíveis usam uma capa alternativa.

## Verificação

```powershell
npm run typecheck
npm test
npm run build
npm run capture:local
```

O navegador de teste usa o Chrome instalado. Outra instalação pode ser indicada pela variável `CHROME_PATH`. As capturas locais e os relatórios ficam em `evidence/local`.

Os arquivos `evidence/rea-*.json` registram a inspeção pelo REA. Os scripts de inspeção autenticada leem credenciais de variáveis de ambiente e usam a redação de segredos do REA. Credenciais do site original não fazem parte do aplicativo.

## Alcance da reprodução

A carteira Pix, apostas, cancelamento, cashout e jogo de cassino são demonstrações locais com dados fictícios. A cotação do Criar Aposta é uma estimativa local. Não há integração financeira, liquidação esportiva ou execução do motor proprietário dos provedores de cassino. Os giros usam um demonstrador próprio, com a capa e a barra do jogo selecionado.

A conferência visual abrange as referências enviadas e as telas capturadas. Ela não estabelece igualdade de 100% em todos os estados possíveis do site.
