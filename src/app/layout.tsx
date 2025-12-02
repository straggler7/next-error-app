import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { AuthProvider } from "../contexts/AuthContext";
import DevBanner from "../components/DevBanner";

// Force all pages to be dynamic (no static generation)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "IRS Error Resolution Application",
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
          <AuthProvider>
            <DevBanner />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
