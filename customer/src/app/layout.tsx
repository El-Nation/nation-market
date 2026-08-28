import type { Metadata } from "next";
import "./globals.css";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "NATION MARKET — Nigeria's Multi-Vendor Marketplace",
  description: "Discover and buy from hundreds of trusted vendors across groceries, fashion, electronics, food, agriculture, pharmacy, books, furniture, and more.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
