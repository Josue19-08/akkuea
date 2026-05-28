import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akkuea Land | City Builder on Stellar",
  description:
    "Build, own, and trade virtual land parcels backed by real-world assets on the Stellar blockchain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
