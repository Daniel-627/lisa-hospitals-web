import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import TokenProvider from "@/components/TokenProvider";
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
  description: "Comprehensive healthcare services in Kisumu, Kenya.",
};

// themeColor moved from `metadata` to `viewport` in Next.js 14+
export const viewport: Viewport = {
  themeColor: "#0B2545",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${dmSerif.variable} ${inter.variable} antialiased`}>
          <TokenProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
