import { NextRequest, NextResponse } from "next/server";
import { panelCall, matchOperation, withoutSecrets } from "@/server/backoffice/http";
import { assertSameOrigin, errorResponse, expireSession, json, jsonBody, noStore, requestContext, withSession } from "@/server/backoffice/request";
import { authenticatePanel } from "@/server/backoffice/user";

export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: NextRequest, route: Context) {
  try {
    const path = "/" + (await route.params).path.join("/");
    const operation = matchOperation(request.method, path);
    if (operation.mutation) assertSameOrigin(request);
    const context = await requestContext(request);
    const body = request.method === "GET" || !request.body ? undefined : await jsonBody(request);
    if (path === "/bet/login") {
      const result = await authenticatePanel(context, body);
      return withSession(json({ user: result.user }), result.session, request);
    }
    const result = await panelCall(context, request.method, path, {
      body, query: request.nextUrl.searchParams, signal: request.signal,
    });
    const response = result.status === 204 ? noStore(new NextResponse(null, { status: 204 }))
      : json(withoutSecrets(result.data), result.status);
    return path === "/api/auth-logout" ? expireSession(response) : response;
  } catch (error) { return errorResponse(error); }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
