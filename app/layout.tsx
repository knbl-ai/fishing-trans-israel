import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "חוצה ישראל",
  description: "כביש 6 - מידע על זכיינים ותשלום אגרה",
  icons: {
    icon: "https://storage.googleapis.com/hotze_landing_page/trans_israel_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <GoogleTagManager gtmId="GTM-TQTQSNL4" />
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="icon" href="https://storage.googleapis.com/hotze_landing_page/trans_israel_icon.png" type="image/png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}