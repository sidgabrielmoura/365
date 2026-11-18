"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Workspace } from "@/components/sports/workspace";
import { useSite } from "@/lib/site-context";
import { formatMoney } from "@/lib/demo-types";
import { ApiError, backoffice, siteFetch } from "@/lib/backoffice/client";
import { useResource } from "@/lib/backoffice/use-resource";
import { moduleEnabled, record, type DataRecord } from "@/lib/backoffice/types";

export function panelRows(value: unknown): DataRecord[] {
  const list = Array.isArray(value) ? value : record(value).data;
  return Array.isArray(list) ? list.map(record) : [];
}

export function usePanel(path: string | null, method = "GET", body?: unknown) {
  return useResource<unknown>(path ? "/api/backoffice" + path : null, { method, body });
}

export function ModulePage({ title, children }: { title: string; children: ReactNode }) {
  return <Workspace sidebar={false} search={false}>
    <section className="section-page">
      <h1>{title}</h1>
      {children}
    </section>
  </Workspace>;
}

function errorText(error: unknown) {
  if (!(error instanceof ApiError)) return (error as Error).message;
  const details = record(error.details);
  const items = [details.pule_errors, details.hunch_errors].flatMap((list) =>
    Array.isArray(list) ? list.map((item) => record(item).error).filter((item) => typeof item === "string") : []);
  return [error.message, ...items].join(" · ");
}

export function usePanelAction() {
  const [result, setResult] = useState<DataRecord>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function execute(path: string, method: string, body?: unknown, onError?: (details: unknown) => string | undefined) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      const data = record(await (path === "/api/actions"
        ? siteFetch(path, { method, body }) : backoffice(path, { method, body })));
      if (typeof data.error === "string" && !data.pin && !data.pin_coupon)
        throw new Error(data.error);
      setResult(data);
      return data;
    } catch (issue) {
      setError((issue instanceof ApiError && onError?.(issue.details)) || errorText(issue));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { result, error, busy, execute };
}

export function Status({ text, error = "" }: { text?: string; error?: string }) {
  return error ? <p role="alert">{error}</p> : text ? <p role="status">{text}</p> : null;
}

export function Value({ label, name, type = "text", required = true }: {
  label: string; name: string; type?: string; required?: boolean;
}) {
  return <label className="me-field">{label}<input name={name} type={type} required={required}
    min={type === "number" ? "0.01" : undefined} step={type === "number" ? "0.01" : undefined} /></label>;
}

export function Result({ data, product, seller = false }: {
  data?: DataRecord; product: "bet" | "traditional" | "loto"; seller?: boolean;
}) {
  const { refresh, session } = useSite();
  const [paid, setPaid] = useState<DataRecord>();
  const [problem, setProblem] = useState("");
  const paymentId = data?.px_id ?? data?.payment_id ?? (data?.copy_past && product === "loto" && !data?.ticket_id ? data.id : undefined);
  const payment = Number(paymentId);
  const ticket = paid?.ticket_id ?? data?.ticket_id;
  const rawCode = data?.px_copy_past ?? data?.copy_past;
  const qr = data?.px_qr_code ?? data?.qrcode ?? data?.qr_code;
  const pin = data?.pin_coupon ?? data?.pin ?? data?.coupon;
  useEffect(() => {
    setPaid(undefined);
    setProblem("");
    if (!Number.isSafeInteger(payment) || payment <= 0) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + 10 * 60 * 1000;
    async function check() {
      if (controller.signal.aborted || Date.now() >= deadline) return;
      try {
        const response = record(await backoffice("/api/status-payment", {
          method: "POST", body: { key: payment }, signal: controller.signal,
        }));
        if (response.status === true) {
          setPaid(response);
          if (session.user) void refresh().catch(() => {});
          return;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!(error instanceof ApiError && error.status === 400 && record(error.details).status === false))
          setProblem(errorText(error));
      }
      timer = setTimeout(() => void check(), 5000);
    }
    timer = setTimeout(() => void check(), 5000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [payment]);
  if (!data) return null;
  return <section aria-live="polite">
    {typeof data.message === "string" && <p>{data.message}</p>}
    {typeof data.pix_error === "string" && <p role="alert">{data.pix_error}</p>}
    {pin != null && <p>Código do pré-bilhete <strong>{String(pin)}</strong></p>}
    {Number.isSafeInteger(payment) && payment > 0 && !paid && <>
      <p>Aguardando pagamento por Pix</p>
      {typeof qr === "string" && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(qr) &&
        <img src={qr} width={200} height={200} alt="QR Code Pix" />}
      {typeof rawCode === "string" && <button className="button" type="button"
        onClick={() => void navigator.clipboard.writeText(rawCode)}>Copiar código Pix</button>}
    </>}
    {paid && <p>Pagamento confirmado.</p>}
    {problem && <p role="alert">{problem}</p>}
    {ticket != null && (!payment || paid) &&
      <Link href={"/ticket/" + product + "/" + encodeURIComponent(String(ticket))}>Ver comprovante</Link>}
    {seller && pin != null && !ticket && <p>Use o código na área do cambista.</p>}
  </section>;
}

export function TicketList({ path, product, allowCancel }: {
  path: string; product: "bet" | "traditional" | "loto"; allowCancel?: boolean;
}) {
  const [page, setPage] = useState(1);
  const resource = usePanel(path + (path.includes("?") ? "&" : "?") + "page=" + page);
  const action = usePanelAction();
  const list = panelRows(resource.data);
  return <>
    <Status error={resource.error || action.error} text={resource.loading ? "Carregando…" : list.length ? "" : "Nenhum bilhete encontrado."} />
    {list.map((item, index) => (
      <p className="me-text" key={String(item.id ?? index)}>
        <Link href={"/ticket/" + product + "/" + encodeURIComponent(String(item.id))}>
          {String(item.coupon ?? item.cupom ?? item.id)} · {String(item.status_label ?? item.status ?? "")}
          {item.bet_amount != null || item.valor_apostado != null
            ? " · " + formatMoney(Number(item.bet_amount ?? item.valor_apostado)) : ""}
        </Link>
        {allowCancel && item.status === "Aberto" && <button className="button" disabled={action.busy} onClick={async () => {
          if (!window.confirm("Cancelar este bilhete?")) return;
          const id = String(item.id);
          if (/^\d+$/.test(id) && await action.execute("/api/actions", "POST", { action: "seller-cancel", id })) resource.retry();
        }}>Cancelar</button>}
      </p>
    ))}
    {page > 1 && <button className="button" onClick={() => setPage(page - 1)}>Anterior</button>}
    {Number(record(resource.data).last_page) > page && <button className="button" onClick={() => setPage(page + 1)}>Próxima</button>}
  </>;
}

export function EnabledModule({ module, children }: { module: string; children: ReactNode }) {
  const { runtime } = useSite();
  return runtime.mode === "backoffice" && moduleEnabled(runtime, module)
    ? children : <p>Este produto está indisponível para o site.</p>;
}
export function formValues(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
}
