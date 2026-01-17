import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { AuthProvider } from "../contexts/AuthContext";
import DevBanner from "../components/DevBanner";

// Force all pages to be dynamic (no static generation)
export const dynamic = 'force-dynamic';
// export const revalidate = 0;

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
        {/* Skip to Main Content Link for 508 Compliance */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:text-sm focus:font-medium focus:rounded-br-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to main content
        </a>
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
