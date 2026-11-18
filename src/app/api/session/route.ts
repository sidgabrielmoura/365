import { NextRequest } from "next/server";
import { errorResponse, json, requestContext } from "@/server/backoffice/request";
import { playerSession } from "@/server/backoffice/user";
import { publicRuntime } from "@/server/backoffice/runtime";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const context = await requestContext(request);
    const [session, site] = await Promise.all([
      playerSession(context), publicRuntime(context.tenant, context),
    ]);
    return json({ session, runtime: site });
  } catch (error) { return errorResponse(error); }
}
