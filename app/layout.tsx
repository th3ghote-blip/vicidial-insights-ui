import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import DemoBanner from "./components/DemoBanner";
import "./globals.css";

const GA_ID = "G-X1BJDV1F5Z";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vicidial Insights",
  description: "Lead scoring + Spanish-first AI analytics for outbound call centers running Vicidial",
};

const themeBootstrap = `
  try {
    var t = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', t === 'dark');
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col">
        <DemoBanner />
        {children}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { linker: { domains: ['vicidialintelligence.com', 'vicidial-insights-ui.vercel.app'] } });
        `}</Script>
      </body>
    </html>
  );
}
