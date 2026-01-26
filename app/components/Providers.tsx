"use client";

import { AuthProvider } from "../lib/auth";
import { ReactNode } from "react";
import ButtonFix from "./ButtonFix";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ButtonFix />
      {children}
    </AuthProvider>
  );
}
