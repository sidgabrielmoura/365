import { readFile } from "node:fs/promises";
import path from "node:path";
import { BackofficeError } from "./errors";
import { record, type BackofficeBindings, type IntegrationMode } from "@/lib/backoffice/types";

export function integrationMode(): IntegrationMode {
  const mode = process.env.BACKOFFICE_MODE || "demo";
  if (mode !== "demo" && mode !== "backoffice")
    throw new BackofficeError("Modo de integração inválido.", 503, "CONFIGURATION");
  return mode;
}
export async function readJsonFile(file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path.resolve(file), "utf8"));
  } catch {
    throw new BackofficeError("Configuração do site indisponível.", 503, "CONFIGURATION");
  }
}
export async function bindings(): Promise<BackofficeBindings> {
  const file = process.env.BACKOFFICE_CONTRACTS_FILE;
  if (!file) return { version: 1 };
  const value = record(await readJsonFile(file));
  if (value.version !== 1)
    throw new BackofficeError("Versão de contratos inválida.", 503, "CONFIGURATION");
  return value as BackofficeBindings;
}
export function upstreamTimeout() {
  const value = Number(process.env.BACKOFFICE_TIMEOUT_MS || 15000);
  return Math.max(1000, Math.min(Number.isFinite(value) ? value : 15000, 30000));
}
