import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BackButton from "@/components/BackButton";
import Script from "next/script";
import { Toaster } from "sonner";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MorphModal } from "@/components/ui/morph-modal";
import { LayoutDashboard, UserRound, BadgePercent, Shield, LogIn } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AjoPay - Thriftly",
  description: "Save small. Grow Big. - Your trusted savings and thrift platform",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: "/aj2.png", sizes: "32x32", type: "image/png" },
      { url: "/aj2.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/aj2.png",
    apple: [
      { url: "/aj2.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/aj2.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/aj2.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AjoPay - Thriftly",
    description: "Save small. Grow Big. - Your trusted savings and thrift platform",
    images: [
      {
        url: "/aj2.png",
        width: 1200,
        height: 630,
        alt: "AjoPay - Thriftly Logo",
      },
    ],
    type: "website",
    siteName: "AjoPay",
  },
  twitter: {
    card: "summary_large_image",
    title: "AjoPay - Thriftly",
    description: "Save small. Grow Big. - Your trusted savings and thrift platform",
    images: [
      {
        url: "/aj2.png",
        width: 1200,
        height: 630,
        alt: "AjoPay - Thriftly Logo",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/aj2.png" type="image/png" />
        <link rel="shortcut icon" href="/aj2.png" type="image/png" />
        <link rel="apple-touch-icon" href="/aj2.png" />
        <meta name="theme-color" content="#8b5cf6" />
      </head>
      <body className={[inter.variable, jetbrainsMono.variable, "antialiased"].join(" ")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Nav />
          <BackButton />
          <main className="pt-12 sm:pt-14">
            {children}
          </main>
          {/* Mobile floating morph modal trigger - show always; contents depend on auth */}
          <div className="sm:hidden fixed bottom-5 right-5 z-40">
            <MorphModal
              trigger={
                <button
                  aria-label="Open menu"
                  className="h-12 w-12 rounded-2xl border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/10 backdrop-blur-2xl shadow-[8px_8px_24px_rgba(0,0,0,0.25),_-8px_-8px_24px_rgba(255,255,255,0.08)] grid place-items-center text-sm"
                >
                  •••
                </button>
              }
              title="Quick Actions"
              description={user ? "Handy shortcuts for mobile" : "Sign in to access the app"}
            >
              <div className="grid gap-2 text-sm">
                {user ? (
                  <>
                    <a href="/dashboard" className="hover:opacity-80 flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </a>
                    <a href="/customer" className="hover:opacity-80 flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      <span>Customer</span>
                    </a>
                    <a href="/agent" className="hover:opacity-80 flex items-center gap-2">
                      <BadgePercent className="h-4 w-4" />
                      <span>Agent</span>
                    </a>
                    <a href="/admin" className="hover:opacity-80 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </a>
                  </>
                ) : (
                  <a href="/sign-in" className="hover:opacity-80 flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </a>
                )}
              </div>
            </MorphModal>
          </div>
          {user && (
            <Footer />
          )}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
        {/* Register Service Worker */}
        <Script id="sw-register" strategy="afterInteractive">{
          `if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }`
        }</Script>
      </body>
    </html>
  );
}
