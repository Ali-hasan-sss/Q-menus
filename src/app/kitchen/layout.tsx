"use client";

import { Providers } from "../providers";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
