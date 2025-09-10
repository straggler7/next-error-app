import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "IRS Error Resolution System",
  description: "Professional tax error resolution and management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
