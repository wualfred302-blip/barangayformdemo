"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Smartphone } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { BottomNav } from "@/components/bottom-nav"

export default function InstallPage() {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://mawaque-linkod.vercel.app"

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href="/dashboard" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Install App</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-28 pt-8">
        <div className="mx-auto max-w-md">
          {/* QR Code Card */}
          <Card className="mb-6 rounded-2xl border-0 shadow-[0_4px_6px_rgba(0,0,0,0.07)]">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10B981]/10">
                  <Smartphone className="h-8 w-8 text-[#10B981]" />
                </div>
              </div>

              <h2 className="mb-2 text-xl font-bold text-[#111827]">Install on Your Phone</h2>
              <p className="mb-8 text-sm text-[#6B7280]">Scan this QR code with your phone camera to install the app</p>

              {/* QR Code */}
              <div className="mb-8 flex justify-center">
                <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <QRCodeSVG value={appUrl} size={200} level="H" bgColor="#FFFFFF" fgColor="#111827" />
                </div>
              </div>

              <p className="text-xs text-[#9CA3AF]">Works on iPhone Safari and Android Chrome</p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-[#111827]">How to Install</h3>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">Scan the QR code</p>
                    <p className="text-sm text-[#6B7280]">Use your phone camera or QR scanner</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">Open in browser</p>
                    <p className="text-sm text-[#6B7280]">The app will open in Safari or Chrome</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">Add to Home Screen</p>
                    <p className="text-sm text-[#6B7280]">Tap the share button → "Add to Home Screen"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
