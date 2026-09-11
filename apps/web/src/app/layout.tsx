import type { Metadata } from "next";

import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

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
    <html lang="pt-PT">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
