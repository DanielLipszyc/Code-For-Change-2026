import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import Navigation from "@/components/Navigation";
import SavedReportsSync from "@/components/SavedReportsSync";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swamp Spotter",
  description: "Spot and submit plants in swamps and wetlands",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Swamp Spotter",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays enabled for accessibility (WCAG 1.4.4); the map handles its own gestures
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0fdf4" },
    { media: "(prefers-color-scheme: dark)", color: "#14532d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <html lang="en" className="light">
        <body className={`${inter.className} antialiased min-h-screen bg-white`}>
          <ToastProvider>
            <ConfirmProvider>
              <SavedReportsSync />
              <Navigation />
              <main className="safe-top safe-bottom">{children}</main>
            </ConfirmProvider>
          </ToastProvider>
        </body>
      </html>
    </LanguageProvider>
  );
}
