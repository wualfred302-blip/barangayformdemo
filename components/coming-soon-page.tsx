"use client"

import Link from "next/link"
import Image from "next/image"
import { LucideIcon, ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ComingSoonPageProps {
  icon: LucideIcon
  title: string
  description: string
  backHref: string
}

export function ComingSoonPage({
  icon: Icon,
  title,
  description,
  backHref,
}: ComingSoonPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href={backHref} className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">{title}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <Card className="flex flex-col items-center justify-center p-8 text-center max-w-md">
          <div className="rounded-full bg-blue-100 p-4 mb-6">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">{description}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href={backHref}>Back to Dashboard</Link>
          </Button>
        </Card>
      </main>
    </div>
  )
}
