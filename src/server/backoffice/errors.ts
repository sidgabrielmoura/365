export class BackofficeError extends Error {
  constructor(
    message: string,
    public status = 502,
    public code = "UPSTREAM_ERROR",
    public details?: unknown,
  ) {
    super(message);
    this.name = "BackofficeError";
  }
}
export function missingContract(name: string): never {
  throw new BackofficeError(
    "Esta operação ainda não está disponível. Tente novamente mais tarde.",
    503, "CONTRACT_REQUIRED", { operation: name },
  );
}
