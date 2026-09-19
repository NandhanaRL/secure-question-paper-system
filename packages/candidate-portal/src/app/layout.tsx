"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  loadAccessibilityPreferences,
  applyAccessibilityPreferences,
} from "@/lib/accessibility";
import "./globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Apply saved accessibility preferences on mount
    const prefs = loadAccessibilityPreferences();
    applyAccessibilityPreferences(prefs);
  }, []);

  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Secure Cloud-Based Just-in-Time Question Paper Generation and Management System - Exam Portal" />
        <meta name="theme-color" content="#4f46e5" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <title>Secure JIT System</title>
      </head>
      <body className="min-h-screen antialiased">
        {/* Skip to content link for keyboard/screen reader users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Screen reader announcement regions */}
        <div
          id="sr-announce-polite"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        <div
          id="sr-announce-assertive"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        />

        <QueryClientProvider client={queryClient}>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </QueryClientProvider>
      </body>
    </html>
  );
}
