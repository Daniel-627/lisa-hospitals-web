import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import TokenProvider from "@/components/TokenProvider";
import SiteChrome from "@/components/SiteChrome";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Verification codes come from Vercel environment variables, so the site can be proven to Google and Bing without a code change.
const verification: NonNullable<Metadata["verification"]> = {
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
  ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
};

export const metadata: Metadata = {
  // Every relative address in the metadata (canonical links, social cards) is resolved against this.
  metadataBase: new URL(SITE_URL),
  title: { default: "Lisa Hospitals | 24-Hour Hospital in Kisumu, Kenya", template: "%s | Lisa Hospitals" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "health",
  keywords: ["hospital in Kisumu", "Lisa Hospitals", "24 hour hospital Kisumu", "emergency care Kisumu", "maternity Kisumu", "Nairobi Highway Kisumu", "SHA hospital Kisumu"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_KE", url: "/", title: "Lisa Hospitals | 24-Hour Hospital in Kisumu, Kenya", description: DEFAULT_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Lisa Hospitals | 24-Hour Hospital in Kisumu, Kenya", description: DEFAULT_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: true, email: true, address: true },
  ...(Object.keys(verification).length ? { verification } : {}),
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
      <html lang="en-KE">
        <body className={`${dmSerif.variable} ${inter.variable} ${outfit.variable} antialiased`}>
          <TokenProvider />
          <SiteChrome
            nav={<PublicNav />}
            footer={<PublicFooter />}
          >
            {children}
          </SiteChrome>
        </body>
      </html>
    </ClerkProvider>
  );
}
