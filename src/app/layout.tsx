import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { STORE } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(STORE.siteUrl),
  title: {
    default: "Pursuit E-Store — Lawn, kurtas, shawls & Pakistani crafts",
    template: "%s | Hunar Bazaar",
  },
  description: STORE.description,
  applicationName: STORE.name,
  keywords: [
    "Pakistani online shopping",
    "unstitched lawn suits",
    "kurtas Pakistan",
    "pashmina shawls",
    "khussa online",
    "prayer rugs",
    "handmade Pakistani crafts",
    "cash on delivery Pakistan",
  ],
  authors: [{ name: "Pursuit E-Store" }],
  creator: "Pursuit E-Store",
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: STORE.name,
    title: "Hunar Bazaar — Crafted in Pakistan",
    description: STORE.description,
    url: STORE.siteUrl,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Hunar Bazaar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hunar Bazaar — Crafted in Pakistan",
    description: STORE.description,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#14532d",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" className={GeistSans.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#15803d",
              colorForeground: "#1c1917",
              colorMutedForeground: "#6f675b",
              colorBackground: "#ffffff",
              colorInput: "#ffffff",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            },
          }}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-800 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ClerkProvider>
      </body>
    </html>
  );
}
