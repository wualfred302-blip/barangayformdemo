"use client"

import { Wallet } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function PaymentPage() {
  return (
    <ComingSoonPage
      icon={Wallet}
      title="Online Payments"
      description="All barangay services are currently FREE. Online payment processing will be available soon for future paid services."
      backHref="/dashboard"
    />
  )
}
