import { Wallet } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"
import { ClientOnly } from "@/components/client-only"

export default function PaymentPage() {
  return (
    <ClientOnly>
      <ComingSoonPage
        icon={<Wallet className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
        title="Online Payments"
        description="All barangay services are currently FREE. Online payment processing will be available soon for future paid services."
        backHref="/dashboard"
      />
    </ClientOnly>
  )
}
