import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "../env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  basePath: "/api/auth",
  plugins: [emailOTPClient()],
  fetchOptions: {
    onRequest: (context) => {
      // Ensure Content-Type is set for JSON requests
      if (context.body && typeof context.body === 'object') {
        context.headers = {
          ...context.headers,
          'Content-Type': 'application/json',
        };
      }
      return context;
    },
  },
});

export const { signIn, signUp, signOut, useSession, resetPassword } =
  authClient;
