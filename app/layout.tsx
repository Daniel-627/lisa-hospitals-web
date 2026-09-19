import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Lisa Hospitals — Your Health, Our Priority",
  description: "Comprehensive healthcare services in Kisumu, Kenya. Book appointments, access medical records, and more.",
  manifest: "/manifest.json",
  themeColor: "#0B2545",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}