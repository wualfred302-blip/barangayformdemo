import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, LogIn, Shield } from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="relative mb-6 h-24 w-24">
          <Image src="/images/mawaque-logo.png" alt="Barangay Mawaque Seal" fill className="object-contain" />
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">Barangay Mawaque</h1>
        <h2 className="text-center text-2xl font-bold tracking-tight text-emerald-600">Linkod App</h2>

        <p className="mt-2 text-center text-sm font-medium text-gray-500">Digital Services</p>

        <p className="mt-4 max-w-[280px] text-center text-sm leading-relaxed text-gray-600">
          Request barangay certificates and documents online. Fast, convenient, and secure.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            asChild
            className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 active:scale-[0.98]"
          >
            <Link href="/register" className="flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
          >
            <Link href="/login" className="flex items-center justify-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-gray-400">For residents of Mabalacat, Pampanga</p>

        <Link
          href="/staff/login"
          className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <Shield className="h-4 w-4" />
          Staff Portal
        </Link>
      </div>
    </div>
  )
}
