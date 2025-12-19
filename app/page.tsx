import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 md:py-24 lg:py-32">
        <div className="flex flex-col items-center justify-center">
          {/* TOP: Logo */}
          <div className="relative w-full flex justify-center">
            <div className="relative w-full max-w-3xl aspect-square">
              <Image
                src="/images/Linkgod-registration-logo.png.png"
                alt="Barangay Mawague Seal"
                fill
                priority
                className="object-contain object-bottom"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-70% to-white pointer-events-none" />
            </div>
          </div>

          {/* BOTTOM: Content */}
          <div className="w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-tight">
                Barangay Mawague
              </h1>
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                Linkod App
              </div>
              <p className="text-xl md:text-2xl font-semibold text-slate-700">
                Digital Services
              </p>
            </div>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg mx-auto">
              Request barangay certificates and documents online. Fast,
              convenient, and secure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Button
                asChild
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg shadow-lg active:scale-[0.98] transition-all"
              >
                <Link href="/register">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-semibold underline decoration-2 decoration-emerald-500 underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
