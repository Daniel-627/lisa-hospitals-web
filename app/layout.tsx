import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import TokenProvider from "@/components/TokenProvider";
import SiteChrome from "@/components/SiteChrome";
import PublicNav from "@/components/PublicNav";
import EmergencyBar from "@/components/EmergencyBar";
import PublicFooter from "@/components/PublicFooter";
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

// width=device-width is what makes the site scale properly on phones and tablets.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B2545",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${dmSerif.variable} ${inter.variable} antialiased`}>
          <TokenProvider />
          <SiteChrome
            nav={<><PublicNav /><EmergencyBar /></>}
            footer={<PublicFooter />}
          >
            {children}
          </SiteChrome>
        </body>
      </html>
    </ClerkProvider>
  );
}
