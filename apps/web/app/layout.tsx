import "./globals.css";
import React from "react";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MediPredict AI — Advanced Medical Intelligence Platform",
  description:
    "Intelligent Healthcare. Earlier Insights. Better Decisions. Evidence-grounded medical RAG, laboratory report intelligence, and clinical research risk models.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
