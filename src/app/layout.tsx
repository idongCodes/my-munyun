import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munyun - Personal Finance Dashboard",
  description: "Secure Wealth Aggregation Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
