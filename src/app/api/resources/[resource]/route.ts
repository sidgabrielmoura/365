import { NextRequest } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requiredText } from "@/server/backoffice/actions";
import { panelCall, withoutSecrets } from "@/server/backoffice/http";
import { assertSameOrigin, errorResponse, json, jsonBody, requestContext } from "@/server/backoffice/request";
import { record } from "@/lib/backoffice/types";
import { bindings } from "@/server/backoffice/config";
import { rows, ticketData, transactionData } from "@/server/backoffice/adapters";
import { BackofficeError } from "@/server/backoffice/errors";
export const runtime = "nodejs";
type Route = { params: Promise<{ resource: string }> };
export async function GET(request: NextRequest, route: Route) {
  try {
    const context = await requestContext(request);
    const name = (await route.params).resource;
    if (name === "regulation") {
      const { data } = await panelCall(context, "GET", "/api/regulamento");
      const raw = record(data);
      const html = typeof data === "string" ? data : String(raw.regulamento || raw.html || "");
      const sanitized = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2"]),
        allowedAttributes: { a: ["href", "title", "rel"] },
        allowedSchemes: ["https", "http", "mailto"], disallowedTagsMode: "discard",
      });
      return json({ html: sanitized, text: sanitizeHtml(sanitized.replace(/<\/(p|li|h[1-6]|div)>|<br\s*\/?\s*>/gi, "\n"), {
        allowedTags: [], allowedAttributes: {},
      }) });
    }
    const config = await bindings();
    if (name === "bets") {
      const { data } = await panelCall(context, "GET", "/api/online/history/bets", { query: request.nextUrl.searchParams });
      return json({ tickets: rows(data).map((item) => ticketData(item, config)),
        page: record(data).current_page, total: record(data).total, lastPage: record(data).last_page });
    }
    if (name === "transactions") {
      const tab = request.nextUrl.searchParams.get("tab") || "transactions";
      if (!["transactions", "deposits", "withdrawals", "casino-plays"].includes(tab)) throw new BackofficeError("Filtro inválido.", 400);
      const query = new URLSearchParams({ page: String(Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1)), per_page: "15" });
      const { data } = await panelCall(context, "GET", "/api/online/" + tab, { query });
      return json({ transactions: rows(data).map((item) => transactionData(item, config, tab)),
        page: record(data).current_page, total: record(data).total, lastPage: record(data).last_page });
    }
    throw new BackofficeError("Recurso não encontrado.", 404);
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: NextRequest, route: Route) {
  try {
    assertSameOrigin(request);
    const context = await requestContext(request);
    const name = (await route.params).resource;
    const body = record(await jsonBody(request));
    if (name === "search") {
      const q = typeof body.query === "string" ? body.query.trim() : "";
      if (q.length < 3) return json([]);
      const { data } = await panelCall(context, "POST", "/api/search-events", {
        body: { q: requiredText(q, "o termo da busca", 3, 120), sport: "soccer" },
        signal: request.signal,
      });
      return json(withoutSecrets(data));
    }
    if (name === "game-launch") {
      const { data } = await panelCall(context, "POST", "/api/casino/games-url", {
        body: { game_id: requiredText(body.reference, "o jogo", 1, 100), is_mobile: body.mobile === true },
        signal: request.signal,
      });
      const candidate = record(data).url;
      const url = typeof candidate === "string" ? URL.parse(candidate) : null;
      if (!url || url.protocol !== "https:" || url.username || url.password)
        throw new BackofficeError("URL de jogo indisponível.", 502);
      return json({ url: url.href });
    }
    throw new BackofficeError("Recurso não encontrado.", 404);
  } catch (error) { return errorResponse(error); }
}
