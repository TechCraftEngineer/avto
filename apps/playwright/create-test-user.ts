import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouter } from "@qbs-autonaim/api";

const email = "playwright-test@example.com";
const password = "TestPassword123";

const orpc = createORPCClient<AppRouter>(
  new RPCLink({
    url: "http://localhost:3000/api/orpc",
    headers: () => ({
      "x-e2e-test-secret": process.env.TEST_SHARED_SECRET ?? "",
    }),
  }),
);

orpc.test
  .setup({
    email,
    password,
    name: "Playwright Test",
    orgName: "Test Org",
    workspaceName: "Test Workspace",
  })
  .then((result) => {
    console.log("✅ User created:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Dashboard: ${result.dashboardUrl}`);
  })
  .catch((error) => console.error("❌ Error:", error));
