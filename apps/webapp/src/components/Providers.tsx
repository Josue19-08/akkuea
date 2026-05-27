"use client";

import { type ReactNode, useEffect } from "react";
import { ThemeProvider } from "@/context/ThemeContext";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root provider tree for the Next.js App Router.
 *
 * When NEXT_PUBLIC_USE_MOCK=true, Mock Service Worker is initialised
 * on the client side so all API calls are intercepted by the mock
 * handlers. This allows full frontend development without a running
 * backend and powers Vercel preview deployments.
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
      import("@/mocks").then(({ initMocks }) => {
        initMocks().catch((err) => {
          console.error("[MSW] Failed to start mock service worker:", err);
        });
      });
    }
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
