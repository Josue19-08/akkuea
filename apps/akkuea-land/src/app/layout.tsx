import React from "react";

export const metadata = {
  title: "Akkuea Land Sandbox",
  description: "High-fidelity interactive metaverse property panel sandbox.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
