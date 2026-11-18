import { NextRequest } from "next/server";
import { integrationMode } from "@/server/backoffice/config";
import { publicRuntime } from "@/server/backoffice/runtime";
import { json, errorResponse, requestContext } from "@/server/backoffice/request";
import { DEMO_RUNTIME } from "@/lib/backoffice/types";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    if (integrationMode() === "demo") return json({ runtime: DEMO_RUNTIME });
    const context = await requestContext(request);
    return json({ runtime: await publicRuntime(context.tenant, context) });
  } catch (error) { return errorResponse(error); }
}
