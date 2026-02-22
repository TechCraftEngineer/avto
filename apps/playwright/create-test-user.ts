import { createORPCClient, httpBatchLink } from "@orpc/client";
import type { AppRouter } from "@qbs-autonaim/api";
import superjson from "superjson";

const email = "playwright-test@example.com";
const password = "TestPassword123";

const orpc = createORPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/orpc",
      transformer: superjson,
    }),
  ],
});

orpc.test?.setup
  .mutate({
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
