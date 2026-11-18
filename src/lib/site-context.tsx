"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_SESSION,
  type DemoSession,
  type DemoPick,
  type DemoResponse,
  type DemoTicket,
} from "./demo-types";
import { builderPick } from "./bet-data";
import { DEMO_RUNTIME, record, type SiteRuntime } from "./backoffice/types";
import { ApiError, backoffice, siteFetch } from "./backoffice/client";
import { builderSelection } from "./backoffice/builder";
import type { SportsEvent } from "./sports-data";
export type ModalState = {
  kind: string;
  tab?: string;
  title?: string;
  payload?: unknown;
} | null;
type SiteContext = {
  runtime: SiteRuntime;
  session: DemoSession;
  modal: ModalState;
  openModal: (value: NonNullable<ModalState>) => void;
  closeModal: () => void;
  request: (input: Record<string, unknown>) => Promise<DemoResponse>;
  refresh: () => Promise<void>;
  picks: DemoPick[];
  togglePick: (pick: DemoPick) => void;
  toggleBuilderPick: (pick: DemoPick) => void;
  removePick: (key: string) => void;
  correctPicks: (details: unknown) => boolean;
  updateLivePicks: (eventId: string, event?: SportsEvent) => void;
  clearPicks: () => void;
  placeBet: (stake: number) => Promise<DemoTicket | undefined>;
  slipOpen: boolean;
  setSlipOpen: (open: boolean) => void;
  notify: (text: string) => void;
};
const Context = createContext<SiteContext | null>(null);
export function useSite() {
  const value = useContext(Context);
  if (!value) throw new Error("SiteProvider ausente");
  return value;
}
export function SiteProvider({
  children,
  initialSession = EMPTY_SESSION,
  initialRuntime = DEMO_RUNTIME,
}: {
  children: ReactNode;
  initialSession?: DemoSession;
  initialRuntime?: SiteRuntime;
}) {
  const [runtime, setRuntime] = useState(initialRuntime);
  const remote = runtime.mode === "backoffice";
  const pickStorage = remote ? "backoffice-picks:" + runtime.tenant?.site_id : "brasa-demo-picks";
  const [builderRules, setBuilderRules] = useState<unknown>();
  const [session, setSession] = useState(initialSession),
    [modal, setModal] = useState<ModalState>(null),
    [picks, setPicks] = useState<DemoPick[]>([]),
    [slipOpen, setSlipOpen] = useState(false),
    [ready, setReady] = useState(false),
    [toast, setToast] = useState("");
  async function refresh() {
    if (remote) {
      const result = await siteFetch<{ session: DemoSession; runtime: SiteRuntime }>("/api/session");
      setSession(result.session);
      setRuntime(result.runtime);
      return;
    }
    const response = await fetch("/api/demo", { cache: "no-store" });
    if (response.ok) setSession((await response.json()).session);
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(pickStorage) || "[]",
      );
      if (Array.isArray(saved)) setPicks(saved);
    } catch {}
    setReady(true);
    void refresh().catch(() => {});
    const expired = () => { setSession(structuredClone(EMPTY_SESSION)); setRuntime(initialRuntime); setPicks([]); setToast("Sua sessão expirou. Entre novamente."); };
    window.addEventListener("backoffice:session-expired", expired);
    return () => window.removeEventListener("backoffice:session-expired", expired);
  }, [pickStorage]);
  useEffect(() => {
    if (ready) localStorage.setItem(pickStorage, JSON.stringify(picks));
  }, [picks, ready, pickStorage]);
  useEffect(() => {
    if (!remote || !runtime.features.builder) return;
    const controller = new AbortController();
    void backoffice("/api/builder", { method: "POST", signal: controller.signal })
      .then(setBuilderRules).catch(() => {});
    return () => controller.abort();
  }, [remote, runtime.features.builder, runtime.tenant?.site_id]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!session.user || !session.preferences.inactivity) return;
    let timer: ReturnType<typeof setTimeout>;
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void request({ action: "logout" })
          .then(() => {
            setToast("Sessão encerrada por inatividade.");
            setModal({ kind: "login" });
          })
          .catch(() => {});
      }, session.preferences.inactivity * 60000);
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((event) =>
      window.addEventListener(event, restart, { passive: true, capture: true }),
    );
    restart();
    return () => {
      clearTimeout(timer);
      events.forEach((event) =>
        window.removeEventListener(event, restart, true),
      );
    };
  }, [session.user?.id, session.preferences.inactivity]);
  async function request(input: Record<string, unknown>) {
    if (remote) {
      if (input.action === "update-preferences") {
        const preferences = input.preferences as Partial<DemoSession["preferences"]>;
        // Presentation preferences remain local; financial limits need a real contract.
        if (preferences.depositLimit !== undefined) throw new Error("Entre em contato com o suporte para alterar seus limites.");
        const updated = { ...session, preferences: { ...session.preferences, ...preferences } };
        setSession(updated);
        return { session: updated };
      }
      const result = await siteFetch<Partial<DemoResponse> & { runtime?: SiteRuntime; sessionPatch?: Partial<DemoSession> }>("/api/actions", { method: "POST", body: input });
      if (result.session) setSession(result.session);
      else if (result.sessionPatch) {
        const patch = result.sessionPatch;
        setSession((previous) => ({ ...previous, ...patch,
          profile: patch.profile ? { ...previous.profile, ...patch.profile } : previous.profile }));
      }
      if (result.runtime) setRuntime(result.runtime);
      else if (input.action === "logout") setRuntime(initialRuntime);
      return { ...result, session: result.session ?? session };
    }
    const response = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setSession(result.session);
    return result as DemoResponse;
  }
  function togglePick(pick: DemoPick) {
    if (remote && pick.enabled === false) return;
    const max = remote ? Number((pick.betType === "live" ? runtime.settings.live_max_quantity : undefined)
      ?? runtime.settings.max_hunches ?? runtime.settings.prematch_max_quantity ?? 0) : 30;
    if (remote && !max) { setToast("Apostas indisponíveis no momento."); return; }
    setPicks((old) =>
      old.some((item) => item.key === pick.key)
        ? old.filter((item) => item.key !== pick.key)
        : [...old.filter((item) => item.eventId !== pick.eventId), pick].slice(
            -max,
          ),
    );
    setSlipOpen(true);
  }
  function updateLivePicks(eventId: string, event?: SportsEvent) {
    const options = new Map(event?.markets.flatMap((market) => market.options.map((option) => [option.id, option] as const)));
    setPicks((old) => {
      let changed = false;
      const next = old.map((pick) => {
        if (pick.betType !== "live" || pick.eventId !== eventId) return pick;
        const option = options.get(pick.selectionId);
        const price = option?.odd ?? pick.odd;
        const enabled = option?.odd != null && option.enabled !== false;
        if (pick.enabled === enabled && pick.odd === price) return pick;
        changed = true;
        return { ...pick, odd: price, enabled };
      });
      return changed ? next : old;
    });
  }
  function toggleBuilderPick(pick: DemoPick) {
    const existing = picks.find(
      (item) => item.eventId === pick.eventId && item.kind === "builder",
    );
    const legs = existing?.children || [];
    const next = legs.some((leg) => leg.key === pick.key)
      ? legs.filter((leg) => leg.key !== pick.key)
      : [...(remote ? legs : legs.filter((leg) => leg.marketId !== pick.marketId)), pick];
    if (!remote && next.length > 13) {
      setToast("O Criar Aposta permite até 13 seleções por jogo.");
      return;
    }
    const grouped = remote ? builderSelection(builderRules, session.user?.level, pick.eventId, next) : builderPick(pick.eventId, next);
    if (remote && next.length && !grouped) {
      setToast("Esta combinação está indisponível no Criar Aposta.");
      return;
    }
    setPicks((old) => [
      ...old.filter((item) => item.eventId !== pick.eventId),
      ...(grouped ? [grouped] : []),
    ]);
    setSlipOpen(true);
  }
  function removePick(key: string) {
    setPicks((old) =>
      old.flatMap((pick) => {
        if (pick.key === key) return [];
        if (
          pick.kind === "builder" &&
          pick.children?.some((child) => child.key === key)
        ) {
          const legs = pick.children.filter((child) => child.key !== key);
          const next = remote
            ? builderSelection(builderRules, session.user?.level, pick.eventId, legs)
            : builderPick(pick.eventId, legs);
          return next ? [next] : [];
        }
        return [pick];
      }),
    );
  }
  function correctPicks(details: unknown) {
    const hunchErrors = record(details).hunch_errors;
    const changes = Array.isArray(hunchErrors) ? hunchErrors.map(record) : [];
    if (!changes.length) return false;
    const update = (pick: DemoPick) => {
      const change = changes.find((item) => String(item.id) === pick.key);
      if (change?.action === "remove") return [];
      const price = Number(change?.correct_price);
      return change?.action === "up_price" && Number.isFinite(price) && price > 0
        ? [{ ...pick, odd: price, originalOdd: undefined }] : [pick];
    };
    setPicks((previous) => previous.flatMap((pick) => {
      if (pick.kind !== "builder" || !pick.children) return update(pick);
      const next = builderSelection(builderRules, session.user?.level, pick.eventId, pick.children.flatMap(update));
      return next ? [next] : [];
    }));
    return changes.some((item) => item.action === "up_price");
  }
  async function placeBet(stake: number) {
    if (remote && picks.some((pick) => pick.betType === "live" && pick.enabled === false))
      throw new Error("Uma cotação ao vivo está indisponível. Aguarde ou remova a seleção.");
    let result: DemoResponse;
    try { result = await request({
      action: "bet-place",
      picks,
      stake,
      operationId: crypto.randomUUID(),
    }); } catch (error) {
      if (remote && error instanceof ApiError && correctPicks(error.details))
        throw new Error("A cotação mudou. Confira os valores atualizados e confirme novamente.");
      throw error;
    }
    setPicks([]);
    setSlipOpen(false);
    setToast("Bilhete registrado.");
    if (remote) window.dispatchEvent(new Event("backoffice:bets-updated"));
    return result.ticket;
  }
  return (
    <Context.Provider
      value={{
        runtime,
        session,
        modal,
        openModal: setModal,
        closeModal: () => setModal(null),
        request,
        refresh,
        picks,
        togglePick,
        toggleBuilderPick,
        removePick,
        correctPicks,
        updateLivePicks,
        clearPicks: () => setPicks([]),
        placeBet,
        slipOpen,
        setSlipOpen,
        notify: setToast,
      }}
    >
      {children}
      {toast && (
        <div id="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
