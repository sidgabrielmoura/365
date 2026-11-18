import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: "http://127.0.0.1:3301" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3301",
    url: "http://127.0.0.1:3301",
    reuseExistingServer: false,
    timeout: 90000,
    env: { BACKOFFICE_MODE: "demo", NEXT_BUILD_DIR: ".next-demo" },
  },
});
