import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="relative h-32 w-32">
            <Image src="/images/image.png" alt="Barangay Mawaque Seal" fill className="object-contain" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Barangay Mawaque</h1>
            <p className="mt-2 text-sm text-gray-600">Mabalacat, Pampanga</p>
            <p className="mt-4 text-base font-semibold text-blue-900">Digital Services Portal</p>
          </div>

          <p className="text-center text-sm text-gray-600">
            Request barangay certificates and documents online. Fast, convenient, and secure.
          </p>

          <div className="flex w-full flex-col gap-3">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">For residents of Barangay Mawaque only</p>
        </CardContent>
      </Card>
    </div>
  )
}
