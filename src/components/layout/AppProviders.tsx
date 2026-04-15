"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        shouldRetryOnError: false,
      }}
    >
      {children}
      <Toaster position="top-right" richColors theme="dark" />
    </SWRConfig>
  );
}
