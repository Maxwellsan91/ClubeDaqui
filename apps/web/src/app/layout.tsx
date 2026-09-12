import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Clube Ribatejo",
    template: "%s | Clube Ribatejo",
  },
  description:
    "Descubra restaurantes, experiências e benefícios exclusivos no Ribatejo.",
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
