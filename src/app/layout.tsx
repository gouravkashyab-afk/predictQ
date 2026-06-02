import type { Metadata } from "next";
import "./globals.css";
import Web3Provider from "@/components/providers/Web3Provider";

export const metadata: Metadata = {
  title: "PredictIQ — AI Prediction Market Terminal",
  description:
    "Trade like a pro with real-time news, whale tracking, AI-powered signals and autonomous trading agents. The smartest prediction market aggregator.",
  keywords: "prediction market, trading, AI signals, whale tracking, Polymarket, Kalshi",
  authors: [{ name: "PredictIQ" }],
  openGraph: {
    title: "PredictIQ — AI Prediction Market Terminal",
    description: "Trade like a pro with real-time news, whale tracking, AI-powered signals and advanced order execution",
    url: "https://predictiq.app",
    siteName: "PredictIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PredictIQ — AI Prediction Market Terminal",
    description: "Trade like a pro with real-time news, whale tracking, AI-powered signals and advanced order execution",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Zilla+Slab:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
