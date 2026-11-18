"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSite } from "@/lib/site-context";
import { formatMoney, formatAccountDate } from "@/lib/demo-types";
import { Workspace } from "@/components/sports/workspace";
import { useResource } from "@/lib/backoffice/use-resource";
import type { DemoTransaction } from "@/lib/demo-types";
import { record } from "@/lib/backoffice/types";

const accountLinks = [
  ["", "Dados de Contato"],
  ["endereco", "Endereço Residencial"],
  ["preferencias", "Preferências"],
  ["senha", "Senha"],
  ["aparelhos", "Aparelhos conectados"],
  ["indique", "Indique e Ganhe"],
];
const bankLinks = [
  ["banco", "Saldo"],
  ["banco/depositar", "Depositar"],
  ["banco/sacar", "Sacar"],
];
const extraTitles: Record<string, string> = {
  controles: "Controles de Aposta",
  atividade: "Minha Atividade",
  historico: "Histórico",
  chat: "Chat ao vivo",
};
function Field({
  name,
  label,
  type = "text",
  value,
  required = true,
  readOnly = false,
  disabled = false,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="me-field">
      <span className="sr-only">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={label}
        defaultValue={value}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        maxLength={type === "password" ? 128 : 150}
      />
    </label>
  );
}
function Choice({
  name,
  label,
  children,
  value,
  required = true,
}: {
  name: string;
  label: string;
  children: ReactNode;
  value?: string | number;
  required?: boolean;
}) {
  return (
    <>
      <div className="me-label">{label}</div>
      <label className="me-select">
        <span className="sr-only">{label}</span>
        <select name={name} defaultValue={value} required={required}>
          {children}
        </select>
      </label>
    </>
  );
}

function AccountContent({ section }: { section: string }) {
  const { session: storedSession, runtime, openModal, request, notify } = useSite(),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editPhone, setEditPhone] = useState(false);
  const remote = runtime.mode === "backoffice";
  const [referral, setReferral] = useState("");
  const history = useResource<{ transactions: DemoTransaction[] }>(
    runtime.mode === "backoffice" && storedSession.user?.level === "online" && ["historico", "atividade"].includes(section)
      ? "/api/resources/transactions" : null);
  const session = runtime.mode === "backoffice" && history.data
    ? { ...storedSession, transactions: history.data.transactions } : storedSession;
  const [sms, setSms] = useState(session.preferences.alertFree),
    [mail, setMail] = useState(session.preferences.alertWins);
  useEffect(() => {
    if (!remote || section !== "indique" || session.user?.level !== "online") return;
    let current = true;
    void request({ action: "referral" }).then((response) => {
      if (!current) return;
      const data = record(response.data);
      if (typeof data.code !== "string") throw new Error("Código de indicação indisponível.");
      const rules = Array.isArray(data.rules) ? data.rules.map(record) : [];
      setReferral("Código: " + data.code + " · Link: " + window.location.origin + "/register?ref=" + encodeURIComponent(data.code) +
        rules.map((rule) => " · " + rule.min_quantity + "–" + rule.max_quantity + " cadastros: " + formatMoney(Number(rule.reward))).join(""));
    }).catch((error: Error) => { if (current) setReferral(error.message); });
    return () => { current = false; };
  }, [remote, section, session.user?.id]);
  useEffect(() => {
    if (session.user && section.startsWith("banco/"))
      openModal({
        kind: "pix",
        tab: section.endsWith("sacar") ? "withdraw" : "deposit",
      });
  }, [section, session.user?.id]);
  async function save(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget,
      fields = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const input =
        action === "update-preferences"
          ? {
              action,
              preferences: {
                timeZone: fields.timeZone,
                inactivity: Number(fields.inactivity),
                alertFree: sms,
                alertWins: mail,
                depositLimit: fields.depositLimit
                  ? Number(fields.depositLimit)
                  : undefined,
              },
            }
          : action === "update-address"
            ? { action, address: fields }
            : { action, ...fields };
      await request(input);
      setMessage(
        action === "update-password"
          ? remote ? "Senha atualizada." : "Senha atualizada. As outras sessões foram encerradas."
          : "Alterações salvas.",
      );
      if (action === "update-password") form.reset();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const feedback = (
    <>
      {error && (
        <p className="me-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="me-message ok" role="status">
          {message}
        </p>
      )}
    </>
  );
  const submit = (label = "Atualizar") => (
    <button className="me-submit" disabled={busy}>
      {busy ? "Aguarde…" : label}
    </button>
  );
  if (!session.user)
    return (
      <>
        <p className="me-text">Entre na sua conta para continuar.</p>
        <button
          className="me-submit"
          onClick={() => openModal({ kind: "login" })}
        >
          Login
        </button>
      </>
    );
  if (section.startsWith("banco"))
    return (
      <div className="me-balance">
        <div className="me-balance-main">
          <div className="me-available">
            <span>Disponível</span>
            <b>{formatMoney(session.available)}</b>
          </div>
          <div className="me-balance-actions">
            <button
              className="me-action"
              onClick={() => openModal({ kind: "pix", tab: "deposit" })}
            >
              <i className="in" aria-hidden="true" />
              Depositar
            </button>
            <button
              className="me-action"
              onClick={() => openModal({ kind: "pix", tab: "withdraw" })}
            >
              <i className="out" aria-hidden="true" />
              Sacar
            </button>
          </div>
        </div>
        <div className="me-balance-side">
          <div>
            <span>Créditos de Apostas de Esportes</span>
            <b>{formatMoney(session.betCredits)}</b>
          </div>
          <div>
            <span>Em Apostas Abertas</span>
            <b>
              {formatMoney(
                session.tickets
                  .filter((ticket) => ticket.status === "open")
                  .reduce((sum, ticket) => sum + ticket.stake, 0),
              )}
            </b>
          </div>
        </div>
      </div>
    );
  if (section === "senha")
    return (
      <>
        <p className="me-text strong">Atualizar senha</p>
        <p className="me-text">
          Use entre 6 e {remote ? 50 : 30} caracteres. Podem ser letras, números ou símbolos.
        </p>
        <p className="me-text">
          Letras maiúsculas e minúsculas são diferentes.
        </p>
        <form onSubmit={(event) => void save(event, "update-password")}>
          <Field name="current" type="password" label="Senha Atual" />
          <section className="me-card">
            <h2 className="me-subtitle">Nova Senha</h2>
            <p className="me-note">
              Digite a nova senha duas vezes, para não correr o risco de um erro
              de digitação.
            </p>
            <Field name="next" type="password" label="Nova Senha" />
            <Field
              name="confirm"
              type="password"
              label="Confirme a Nova Senha"
            />
          </section>
          {feedback}
          {submit()}
        </form>
      </>
    );
  if (section === "endereco")
    return (
      <>
        <p className="me-text strong">Altere o endereço da sua conta</p>
        <p className="me-text">
          {session.profile?.address
            ? "Confira o endereço da sua conta."
            : "Nenhum endereço cadastrado. Preencha abaixo."}
        </p>
        <form onSubmit={(event) => void save(event, "update-address")}>
          {[
            ["postalCode", "CEP"],
            ["street", "Rua"],
            ["number", "Número"],
            ["complement", "Complemento (opcional)"],
            ["district", "Bairro"],
            ["city", "Cidade"],
          ].map(([key, label]) => (
            <Field
              key={key}
              name={key}
              label={label}
              value={session.profile?.address?.[key]}
              required={remote ? key === "street" : key !== "complement"}
            />
          ))}
          <Choice
            name="state"
            label="Estado"
            value={session.profile?.address?.state || ""}
            required={!remote}
          >
            <option value="">Por favor selecione</option>
            {"AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO"
              .split(" ")
              .map((state) => (
                <option key={state}>{state}</option>
              ))}
          </Choice>
          {feedback}
          {submit("Salvar endereço")}
        </form>
      </>
    );
  if (section === "preferencias")
    return (
      <form onSubmit={(event) => void save(event, "update-preferences")}>
        <Choice name="language" label="Idioma" value="pt">
          <option value="pt">Português</option>
        </Choice>
        <Choice
          name="timeZone"
          label="Fuso Horário"
          value={session.preferences.timeZone}
        >
          <option value="auto">Automático (dispositivo)</option>
          <option value="America/Sao_Paulo">Horário de Brasília</option>
        </Choice>
        <p className="me-note">Esta preferência vale neste navegador.</p>
        <Choice
          name="inactivity"
          label="Máximo de Inatividade"
          value={session.preferences.inactivity}
        >
          {[
            [0, "Desativado (padrão)"],
            [15, "15 Minutos"],
            [30, "30 Minutos"],
            [60, "60 Minutos"],
            [120, "2 Horas"],
          ].map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </Choice>
        <h2 className="me-subtitle">
          Escolha a forma como recebe as suas ofertas
        </h2>
        <p className="me-text strong">Comunicação Externa</p>
        {[
          ["Mensagem de Texto", sms, setSms],
          ["E-mail", mail, setMail],
        ].map(([label, value, setValue]) => (
          <div className="me-yesno-row" key={String(label)}>
            <span>{String(label)}</span>
            <div className="me-yesno" role="group" aria-label={String(label)}>
              {[true, false].map((choice) => (
                <button
                  className={choice === value ? "on" : ""}
                  type="button"
                  key={String(choice)}
                  aria-pressed={choice === value}
                  onClick={() =>
                    typeof setValue === "function" && setValue(choice)
                  }
                >
                  {choice ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </div>
        ))}
        {feedback}
        {submit()}
      </form>
    );
  if (section === "aparelhos")
    return (
      <>
        <p className="me-text">
          Sua conta permanece conectada por 7 dias. Se um aparelho não for seu,
          encerre as outras sessões e troque sua senha.
        </p>
        <div className="me-device-local">
          <strong>
            Navegador atual <small>este aparelho</small>
          </strong>
          <p>Conexão local · {formatAccountDate(session.user.createdAt)}</p>
        </div>
        <button
          className="me-submit"
          onClick={async () => {
            try {
              await request({ action: "revoke-sessions" });
              notify("As outras sessões locais foram encerradas.");
            } catch (error) {
              notify((error as Error).message);
            }
          }}
        >
          Sair de todos os outros aparelhos
        </button>
      </>
    );
  if (section === "indique")
    return (
      <>
        <p className="me-text strong">{remote ? "Indique e Ganhe" : "Programa em breve"}</p>
        <p className="me-text">
          {remote ? referral || "Carregando sua indicação…" : "Quando o programa de indicação estiver disponível, o seu link aparecerá nesta página."}
        </p>
      </>
    );
  if (section === "historico" || section === "atividade")
    return (
      <>
        <p className="me-text">
          {session.transactions.length
            ? "Movimentações da sua conta"
            : "Você ainda não possui movimentações."}
        </p>
        {session.transactions.map((transaction) => (
          <div className="account-transaction" key={transaction.id}>
            <span>
              {
                {
                  deposit: "Depósito Pix",
                  withdrawal: "Saque Pix",
                  bet: "Aposta",
                  refund: "Devolução",
                  cashout: "Encerrar aposta",
                }[transaction.kind]
              }
              <small>{formatAccountDate(transaction.createdAt)}</small>
            </span>
            <strong>{formatMoney(transaction.amount)}</strong>
          </div>
        ))}
      </>
    );
  if (section === "controles")
    return (
      <form onSubmit={(event) => void save(event, "update-preferences")}>
        <p className="me-text">Defina o limite de cada depósito.</p>
        <Field
          name="depositLimit"
          label="Limite de depósito"
          type="number"
          value={String(session.preferences.depositLimit)}
        />
        {feedback}
        {submit("Salvar limite")}
        <Link className="me-link" href="/jogo-responsavel">
          Jogo Responsável
        </Link>
      </form>
    );
  if (section === "chat")
    return (
      <>
        <p className="me-text strong">Como podemos ajudar?</p>
        <p className="me-text">
          Consulte as informações sobre depósitos, saques e apostas.
        </p>
        <Link className="me-link" href="/ajuda">
          Acessar ajuda
        </Link>
      </>
    );
  return (
    <>
      <div className="me-label">Telefone para Contato</div>
      <div className="me-pair">
        <b>{session.profile?.phone || "Não informado"}</b>
        <button className="me-link" onClick={() => setEditPhone(!editPhone)}>
          Editar
        </button>
      </div>
      <div className="me-label">Usuário</div>
      <div className="me-pair">
        <b>{session.user.username}</b>
      </div>
      <div className="me-label">E-mail</div>
      <form onSubmit={(event) => void save(event, "update-contact")}>
        <Field
          name="email"
          type="email"
          label="E-mail"
          value={session.user.email}
          readOnly={remote}
        />
        {editPhone && (
          <Field
            name="phone"
            label="Telefone para Contato"
            value={session.profile?.phone}
          />
        )}
        <Field name="password" type="password" label="Senha" required={!remote} disabled={remote} />
        {feedback}
        {submit()}
        <button
          className="me-cancel"
          type="reset"
          onClick={() => {
            setError("");
            setMessage("");
          }}
        >
          Cancelar
        </button>
      </form>
    </>
  );
}
export function AccountPage({ section = "" }: { section?: string }) {
  const { session } = useSite(),
    bank = section.startsWith("banco"),
    links = bank ? bankLinks : accountLinks;
  const title =
    extraTitles[section] ||
    links.find(([id]) => id === section)?.[1] ||
    "Dados de Contato";
  return (
    <Workspace sidebar={false} search={false}>
      <section className="me" aria-label={bank ? "Banco" : "A Minha Conta"}>
        <nav className="me-nav" aria-label={bank ? "Banco" : "A Minha Conta"}>
          <h2>{bank ? "Banco" : "A Minha Conta"}</h2>
          {links.map(([id, label]) => (
            <Link
              key={id}
              href={`/conta${id ? `/${id}` : ""}`}
              className={id === section ? "on" : ""}
              aria-current={id === section ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="me-main">
          <h1 className="me-title">{title}</h1>
          <AccountContent
            key={`${session.user?.id || "guest"}|${section}`}
            section={section}
          />
        </div>
      </section>
    </Workspace>
  );
}
