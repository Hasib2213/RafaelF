import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Curio - Turn YouTube Videos into Smart Audio Briefings",
  description: "Save hours every week. Get AI-generated summaries of your favorite YouTube videos, delivered as audio briefings you can listen to anywhere.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-[#0F172A] text-white font-sans antialiased selection:bg-[#7A3BED] selection:text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

