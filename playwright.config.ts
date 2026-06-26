import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:3107",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command:
      "PORT=3107 NEXTAUTH_URL=http://127.0.0.1:3107 NEXTAUTH_SECRET=playwright-secret pnpm dev",
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
