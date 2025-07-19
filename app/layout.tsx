import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clientlane - Professional Client Portal for Freelancers & Agencies",
  description: "Transform client collaboration with professional portals. Share files, updates, and feedback in one beautiful link. Trusted by 500+ freelancers worldwide. Start free today.",
  keywords: [
    "client portal",
    "freelancer tools",
    "client collaboration",
    "file sharing",
    "project management",
    "agency tools",
    "client communication",
    "professional portal",
    "freelance business",
    "client feedback"
  ],
  authors: [{ name: "Clientlane Team" }],
  creator: "Clientlane",
  publisher: "Clientlane",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://clientlane.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Clientlane - Professional Client Portal for Freelancers & Agencies",
    description: "Transform client collaboration with professional portals. Share files, updates, and feedback in one beautiful link. Start free today.",
    url: 'https://clientlane.vercel.app',
    siteName: 'Clientlane',
    images: [
      {
        url: '/icons/lightTransparentLogo.png',
        width: 1200,
        height: 630,
        alt: 'Clientlane - Professional Client Portal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Clientlane - Professional Client Portal for Freelancers & Agencies",
    description: "Transform client collaboration with professional portals. Share files, updates, and feedback in one beautiful link.",
    images: ['/icons/lightTransparentLogo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
          <Toaster position="top-center" richColors />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
