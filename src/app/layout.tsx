import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowLine",
  description: "Visual workflow board with timer-based ticket movement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
