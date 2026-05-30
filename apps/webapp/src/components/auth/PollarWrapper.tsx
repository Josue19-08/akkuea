"use client";

import { type ReactNode } from "react";

interface PollarWrapperProps {
  children: ReactNode;
}

/**
 * Renders children only when the Pollar provider is available
 * (i.e. NEXT_PUBLIC_POLLAR_KEY is set).
 */
export function PollarWrapper({ children }: PollarWrapperProps) {
  if (!process.env.NEXT_PUBLIC_POLLAR_KEY) return null;
  return <>{children}</>;
}
