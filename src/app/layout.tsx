import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified Balance Dashboard",
  description:
    "USDC Unified Balance across chains — powered by Arc App Kit & Circle Gateway",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-[#07080d] antialiased">{children}</body>
    </html>
  );
}
