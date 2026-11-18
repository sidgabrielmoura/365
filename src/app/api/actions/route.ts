import { NextRequest } from "next/server";
import { record } from "@/lib/backoffice/types";
import { action, registrationInput } from "@/server/backoffice/actions";
import { authenticatePanel, playerSession } from "@/server/backoffice/user";
import { panelCall, withoutSecrets } from "@/server/backoffice/http";
import { publicRuntime } from "@/server/backoffice/runtime";
import { assertSameOrigin, errorResponse, expireSession, json, jsonBody, requestContext, withSession } from "@/server/backoffice/request";
import { emptySession } from "@/server/backoffice/adapters";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const context = await requestContext(request);
    const input = record(await jsonBody(request));
    if (input.action === "login") {
      const result = await authenticatePanel(context, { username: input.username || input.email, password: input.password });
      context.session = result.session;
      const session = await playerSession(context);
      return withSession(json({ session, runtime: await publicRuntime(context.tenant, context) }), result.session, request);
    }
    if (input.action === "logout") {
      try { if (context.session) await panelCall(context, "POST", "/api/auth-logout", { body: {} }); }
      catch { /* Always clear this browser's cookie, even if logout is unavailable. */ }
      return expireSession(json({ session: emptySession() }));
    }
    if (input.action === "register") {
      const runtime = await publicRuntime(context.tenant);
      if (!runtime.features.register) return json({ error: "Cadastro indisponível.", code: "REGISTRATION_DISABLED" }, 403);
      const registration = registrationInput(runtime.settings.register_mode, input);
      const { data } = await panelCall(context, "POST", registration.path, { body: registration.body });
      return json({ data: withoutSecrets(data) });
    }
    return json(withoutSecrets(await action(context, input)));
  } catch (error) { return errorResponse(error); }
}
