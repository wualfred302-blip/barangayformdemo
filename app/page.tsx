'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-8 relative">
        {/* Logo Section */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-y-14 gap-x-2 w-full -mb-3 mt-12 px-1">
          {/* Bagong Pilipinas Logo */}
          <div className="w-[48%] flex justify-center -translate-y-[30px]">
            <Image
              src="/images/bagongpilipinas-logo-main.png"
              alt="Bagong Pilipinas Logo"
              width={300}
              height={300}
              priority
              className="w-full h-auto object-contain drop-shadow-sm scale-[1.55]"
            />
          </div>
          
          {/* Punong Barangay Logo */}
          <div className="w-[48%] flex justify-center -translate-y-[30px]">
            <Image
              src="/images/Punongbarangay.logo.png"
              alt="Punong Barangay Logo"
              width={300}
              height={300}
              priority
              className="w-full h-auto object-contain drop-shadow-sm scale-135"
            />
          </div>

          {/* Linkod App Logo */}
          <div className="w-[48%] flex justify-center mt-2 -translate-y-[20px]">
            <Image
              src="/images/linkod-app-logo-main.png"
              alt="Linkod App Logo"
              width={300}
              height={300}
              priority
              className="w-full h-auto object-contain drop-shadow-md scale-[1.70]"
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="space-y-4 relative z-20">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#003399]">
              Barangay
            </h1>
            <h2 className="text-4xl font-black text-[#22c55e]">
              Linkod App
            </h2>
            <p className="text-lg font-bold text-slate-700">
              Digital Services
            </p>
          </div>
          
          <p className="text-slate-600 leading-relaxed max-w-xs mx-auto">
            Request barangay certificates and documents online. Fast, convenient, and secure.
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4 pt-4">
          <Button asChild className="w-full h-14 rounded-full bg-gradient-to-r from-[#003399] to-[#cc0000] hover:opacity-90 text-white font-bold text-lg shadow-lg transition-all">
            <Link href="/register">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full h-14 rounded-full border-2 border-[#003399] bg-white text-[#003399] font-bold text-lg shadow-sm hover:bg-slate-50 transition-all">
            <Link href="/login">
              → Sign In
            </Link>
          </Button>
        </div>

        {/* Footer Link */}
        <div className="pt-8">
          <Link href="/staff/login" className="text-sm font-semibold text-[#003399] hover:underline flex items-center gap-1">
            Staff Portal →
          </Link>
        </div>
      </div>
    </main>
  );
}
