"use client"

import { Receipt } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function PaymentHistoryPage() {
  return (
    <ComingSoonPage
      icon={Receipt}
      title="Payment History"
      description="Payment tracking will be available once online payment processing is implemented. All current services are FREE."
      backHref="/dashboard"
    />
  )
}
