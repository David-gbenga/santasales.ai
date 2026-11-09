import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
// Set PLAYWRIGHT_BASE_URL to test an already-running server or a deployment.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: externalBaseURL ?? `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: "pnpm build && pnpm start",
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
