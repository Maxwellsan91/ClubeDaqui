import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { LanguageProvider } from "@/components/language-provider";
import { MobileNav } from "@/components/mobile-nav";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Clube Daqui",
    template: "%s | Clube Daqui",
  },
  description:
    "Descobre restaurantes, experiências e benefícios exclusivos. O melhor daqui.",
  openGraph: {
    title: "Clube Daqui",
    description: "Descobre o melhor daqui.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    siteName: "Clube Daqui",
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clube Daqui",
    description: "Descobre o melhor daqui.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <LanguageProvider>
          {children}
          <SiteFooter />
          <MobileNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
