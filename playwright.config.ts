import { defineConfig, devices } from "@playwright/test";

// Runs against a real dev server + the real linked Supabase project (see
// .env.local) — no mocking of the DB layer. MOCK_PROVIDERS=true means
// WhatsApp/email sends are logged, not real, so this is safe to run
// repeatedly without spamming real customers.
export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false, // tests share the live DB; avoid cross-test stock races
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
