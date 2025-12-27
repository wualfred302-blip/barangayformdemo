import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
// Direct imports (no dynamic/ssr:false) - Next.js handles hydration
import { AuthProvider } from "@/lib/auth-context"
import { ResidentsProvider } from "@/lib/residents-context"
import { CertificateProvider } from "@/lib/certificate-context"
import { BlotterProvider } from "@/lib/blotter-context"
import { AnnouncementsProvider } from "@/lib/announcements-context"
import { BayanihanProvider } from "@/lib/bayanihan-context"
import { PaymentProvider } from "@/lib/payment-context"
import { QRTProvider } from "@/lib/qrt-context"
import { Toaster } from "sonner"
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Barangay Mawague Linkod App",
  description: "Request barangay certificates online - Fast, convenient, and secure",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mawaque Linkod",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ResidentsProvider>
            <PaymentProvider>
              <QRTProvider>
                <CertificateProvider>
                  <BlotterProvider>
                    <AnnouncementsProvider>
                      <BayanihanProvider>
                        {children}
                      </BayanihanProvider>
                    </AnnouncementsProvider>
                  </BlotterProvider>
                </CertificateProvider>
              </QRTProvider>
            </PaymentProvider>
          </ResidentsProvider>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
