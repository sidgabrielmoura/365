import { cookies, headers } from "next/headers";
import { resolveTenant } from "./tenant";
import { openSession, SESSION_COOKIE } from "./session";
import type { CallContext } from "./http";
export async function pageContext(): Promise<CallContext> {
  const incoming = await headers();
  const tenant = await resolveTenant(incoming.get("host") || "");
  return { tenant, session: openSession((await cookies()).get(SESSION_COOKIE)?.value, tenant),
    timezone: incoming.get("x-timezone") || "America/Sao_Paulo" };
}
