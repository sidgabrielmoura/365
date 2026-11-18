/**
 * Read-only verification against the tenant supplied on 2026-11-18:
 * GET informations/withdrawal-data -> 405 Allow: PUT;
 * POST can-withdraw -> 405 Allow: GET, HEAD. No PUT was executed in testing.
 * These additions do not silently rewrite the original 104-operation catalogue.
 */
export const observedOperations = [
  { id: "OBS-001", method: "PUT", path: "/api/online/informations", auth: "online", mutation: true, sourceLine: 75 },
  { id: "OBS-002", method: "PUT", path: "/api/online/withdrawal-data", auth: "online", mutation: true, sourceLine: 76 },
  { id: "OBS-003", method: "GET", path: "/api/online/can-withdraw", auth: "online", mutation: false, sourceLine: 149 },
] as const;
