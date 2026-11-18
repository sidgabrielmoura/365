export type DemoUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt: string;
  level?: "online" | "cambista";
};

export type DemoPickInput = {
  eventId: string;
  marketId: string;
  selectionId: string;
  legs?: DemoPickInput[];
  boostId?: string;
};

export type DemoPick = DemoPickInput & {
  key: string;
  eventLabel: string;
  marketLabel: string;
  label: string;
  odd: number;
  kind?: "builder" | "boost";
  children?: DemoPick[];
  originalOdd?: number;
  betType?: "prematch" | "live";
  optionCode?: number;
  marketCode?: number;
  enabled?: boolean;
  fixture?: { home: string; away: string; homeLogo?: string; awayLogo?: string; start: string; status: string; scores?: { home: number; away: number } };
  result?: "open" | "won" | "lost" | "void" | "cancelled" | "cashout";
};

export type DemoTicket = {
  id: string;
  picks: DemoPick[];
  stake: number;
  odds: number;
  potential: number;
  createdAt: string;
  status: "open" | "won" | "lost" | "void" | "cancelled" | "cashout";
  returnAmount?: number;
  cashoutOffer?: { amount: number; expiresAt?: string; payload: Record<string, unknown> };
  canCancel?: boolean;
  detailsLoaded?: boolean;
  typeLabel?: string;
  isLive?: boolean;
};

export type DemoTransaction = {
  id: string;
  kind: "deposit" | "withdrawal" | "bet" | "refund" | "cashout";
  amount: number;
  createdAt: string;
  reference: string;
};

export type DemoDeposit = {
  id: string;
  amount: number;
  code: string;
  createdAt: string;
  expiresAt: string;
  state: "pending" | "paid";
  qrCode?: string;
};

export type DemoPreferences = {
  showBalance: boolean;
  alertWins: boolean;
  alertFree: boolean;
  timeZone: string;
  inactivity: number;
  depositLimit: number;
};

export type DemoSession = {
  user: DemoUser | null;
  balance: number;
  available: number;
  betCredits: number;
  tickets: DemoTicket[];
  transactions: DemoTransaction[];
  pendingDeposits: DemoDeposit[];
  preferences: DemoPreferences;
  profile?: { phone?: string; address?: Record<string, string> };
};

export type DemoResponse = {
  session: DemoSession;
  ticket?: DemoTicket;
  deposit?: DemoDeposit;
  data?: unknown;
};

export const DEFAULT_PREFERENCES: DemoPreferences = {
  showBalance: true,
  alertWins: false,
  alertFree: false,
  timeZone: "America/Sao_Paulo",
  inactivity: 0,
  depositLimit: 2500,
};

export const EMPTY_SESSION: DemoSession = {
  user: null,
  balance: 0,
  available: 0,
  betCredits: 0,
  tickets: [],
  transactions: [],
  pendingDeposits: [],
  preferences: DEFAULT_PREFERENCES,
};

export const PIX_KEY_TYPES = ["CPF", "E-mail", "Celular", "Aleatória"] as const;
export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoney(value: number) {
  return currency.format(value);
}

export function compactMoney(value: number) {
  return formatMoney(value).replace(/\s/g, "");
}

export function formatAccountDate(
  value: string,
  timeZone = "America/Sao_Paulo",
) {
  if (Number.isNaN(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
