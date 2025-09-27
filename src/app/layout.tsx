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
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";


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
  title: {
    default: "AjoPay - Thriftly | Digital Savings & Thrift Platform",
    template: "%s | AjoPay - Thriftly"
  },
  description: "AjoPay (Thriftly) is Nigeria's leading digital savings platform. Save small amounts daily, build financial habits, and grow your wealth with our secure thrift and savings circles. Perfect for students, professionals, and families.",
  keywords: [
    "digital savings",
    "thrift platform",
    "savings app Nigeria",
    "ajo savings",
    "esusu savings",
    "daily savings",
    "financial habits",
    "savings circles",
    "group savings",
    "mobile banking",
    "fintech Nigeria",
    "personal finance",
    "wealth building",
    "student savings",
    "micro savings"
  ],
  authors: [{ name: "AjoPay Team" }],
  creator: "AjoPay",
  publisher: "AjoPay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ajopay.vercel.app'),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
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
    type: "website",
    locale: "en_NG",
    url: "/",
    title: "AjoPay - Thriftly | Digital Savings & Thrift Platform",
    description: "Nigeria's leading digital savings platform. Save small amounts daily, build financial habits, and grow your wealth with secure thrift and savings circles.",
    siteName: "AjoPay - Thriftly",
    images: [
      {
        url: "/aj2.png",
        width: 1200,
        height: 630,
        alt: "AjoPay - Thriftly Digital Savings Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AjoPay - Thriftly | Digital Savings & Thrift Platform",
    description: "Nigeria's leading digital savings platform. Save small amounts daily, build financial habits, and grow your wealth.",
    images: [
      {
        url: "/aj2.png",
        width: 1200,
        height: 630,
        alt: "AjoPay - Thriftly Digital Savings Platform",
      },
    ],
    creator: "@ajopay",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: "Finance",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              "name": "AjoPay - Thriftly",
              "description": "Nigeria's leading digital savings platform for daily thrift and group savings",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://ajopay.vercel.app",
              "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://ajopay.vercel.app"}/aj2.png`,
              "image": `${process.env.NEXT_PUBLIC_APP_URL || "https://ajopay.vercel.app"}/aj2.png`,
              "telephone": "+234-XXX-XXX-XXXX",
              "email": "support@ajopay.com",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NG",
                "addressRegion": "Lagos"
              },
              "serviceType": "Digital Banking and Savings",
              "areaServed": "Nigeria",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Savings Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Daily Savings",
                      "description": "Save small amounts daily to build financial habits"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Savings Circles",
                      "description": "Join group savings circles (Ajo, Esusu, Thrift)"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Digital Wallet",
                      "description": "Secure digital wallet for managing savings"
                    }
                  }
                ]
              },
              "sameAs": [
                "https://twitter.com/ajopay",
                "https://facebook.com/ajopay",
                "https://instagram.com/ajopay"
              ]
            })
          }}
        />
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
          <SpeedInsights />
          <Analytics />
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
