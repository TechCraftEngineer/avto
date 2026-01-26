import { headers } from "next/headers";

// Server component that provides nonce context for client components that need it
export async function NonceProvider({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');


  // Next.js automatically applies nonce to scripts when present in CSP header
  // We provide context for any components that need explicit nonce access
  return (
    <div data-csp-nonce={nonce || ''}>
      {children}
    </div>
  );
}