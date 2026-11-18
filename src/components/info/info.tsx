"use client";
import Link from "next/link";
import { useSite } from "@/lib/site-context";
import { Workspace } from "@/components/sports/workspace";
import { useResource } from "@/lib/backoffice/use-resource";
import { ORIGINAL_BRAND } from "@/lib/backoffice/branding";
const topics = [
  [
    "Depósitos",
    "Acesse o saldo no cabeçalho e escolha Depositar. Nesta cópia, gere um código de demonstração e use Simular pagamento para adicionar créditos fictícios.",
  ],
  [
    "Saques",
    "Abra Pix, selecione Sacar, informe o valor e escolha o tipo da chave. A solicitação fica registrada nas movimentações locais.",
  ],
  [
    "Apostas",
    "Selecione as odds dos jogos, confira o bilhete e informe o valor. Suas apostas confirmadas aparecem em Minhas Apostas.",
  ],
  [
    "Conta",
    "Crie uma conta local ou escolha Explorar demonstração no login. Seus dados dessa cópia ficam neste computador.",
  ],
  [
    "Cassino",
    "A biblioteca permite pesquisar e navegar entre categorias e provedores. Cada jogo abre uma demonstração local com créditos próprios.",
  ],
];
export function Help() {
  const { runtime } = useSite();
  return (
    <Workspace sidebar={false} search={false}>
      <article className="section-page">
        <Link href="/">‹ Voltar</Link>
        <h1>Ajuda {runtime.branding?.name ?? ORIGINAL_BRAND}</h1>
        {topics.map(([title, text]) => (
          <details className="event-market" key={title}>
            <summary>{title}</summary>
            <p style={{ padding: "0 18px 15px" }}>{text}</p>
          </details>
        ))}
        <Link className="button button-outline" href="/conta/chat">
          Chat ao vivo
        </Link>
      </article>
    </Workspace>
  );
}
export function Responsible() {
  const { runtime } = useSite();
  return (
    <Workspace sidebar={false} search={false}>
      <article className="section-page">
        <Link href="/">{runtime.branding ? "‹ Voltar para " + runtime.branding.name : "‹ Voltar à BrasaBet"}</Link>
        <p>JOGO RESPONSÁVEL</p>
        <h1>Jogue no seu ritmo.</h1>
        <p>
          Aposta é entretenimento. Jogue com responsabilidade e respeite os seus
          limites.
        </p>
        <h2>Apenas para maiores de 18 anos</h2>
        <p>
          O acesso a apostas é permitido apenas a pessoas com 18 anos ou mais.
        </p>
        <h2>Defina seus limites</h2>
        <p>
          Estabeleça limites de tempo e dinheiro, faça pausas e acompanhe a sua
          atividade.
        </p>
        <Link className="button button-accent" href="/conta/controles">
          Controles de Aposta
        </Link>
        <h2>Reconheça quando parar</h2>
        <p>
          Evite tentar recuperar perdas. Se jogar afeta sua rotina, procure
          apoio e afaste-se das apostas.
        </p>
      </article>
    </Workspace>
  );
}
export function Legal({ privacy = false }: { privacy?: boolean }) {
  const { runtime } = useSite();
  const remote = runtime.mode === "backoffice";
  const regulation = useResource<{ text: string }>(remote && !privacy ? "/api/resources/regulation" : null);
  return (
    <Workspace sidebar={false} search={false}>
      <article className="section-page">
        <Link href="/">‹ Voltar</Link>
        <h1>{privacy ? "Política de Privacidade" : "Termos e Condições"}</h1>
        <p>
          {remote && !privacy ? regulation.error || (regulation.loading ? "Carregando regulamento…" : "Regulamento publicado pelo operador.")
            : remote ? "A conta e as operações são gerenciadas pelo operador do serviço."
            : "Esta interface é uma reprodução local para demonstração. O acesso às funções usa uma conta criada neste computador."}
        </p>
        <h2>
          {privacy ? "Dados e armazenamento" : remote ? "Regulamento" : "Funcionamento da demonstração"}
        </h2>
        <p style={remote && !privacy ? { whiteSpace: "pre-line" } : undefined}>
          {remote ? privacy ? "Consulte o operador para saber como os dados da conta são tratados."
            : regulation.data?.text || (!regulation.loading && !regulation.error ? "Nenhum regulamento cadastrado." : "")
            : privacy
            ? "Os dados de cadastro, sessões, apostas e movimentações são armazenados no banco local da aplicação. As senhas são derivadas com scrypt. As chaves Pix digitadas não são guardadas."
            : "Os valores, apostas, depósitos, saques e jogos de cassino usam créditos fictícios. Os eventos e odds exibidos correspondem às capturas públicas registradas em 18 de novembro de 2026."}
        </p>
        <h2>Jogo Responsável</h2>
        <p>
          Acesso destinado a maiores de 18 anos. Confira as ferramentas de
          controle da conta.
        </p>
        <Link href="/jogo-responsavel">Jogo Responsável</Link>
      </article>
    </Workspace>
  );
}
export function AppInstall() {
  const { notify, runtime } = useSite();
  return (
    <Workspace sidebar={false} search={false}>
      <article className="section-page">
        <Link href="/">‹ Voltar</Link>
        <h1>App {runtime.branding?.name ?? ORIGINAL_BRAND}</h1>
        <p>
          Abra esta página no navegador do seu celular e escolha Adicionar à
          tela inicial para ter um atalho para a demonstração.
        </p>
        <button
          className="button button-accent"
          onClick={() =>
            notify("No menu do navegador, escolha Adicionar à tela inicial.")
          }
        >
          Como instalar
        </button>
      </article>
    </Workspace>
  );
}
