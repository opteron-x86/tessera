"use client";

import { SessionProvider } from "next-auth/react";
import { TesseraStoreProvider } from "@/lib/client/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TesseraStoreProvider>{children}</TesseraStoreProvider>
    </SessionProvider>
  );
}
