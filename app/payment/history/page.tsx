import { Receipt } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"
import { ClientOnly } from "@/components/client-only"

export default function PaymentHistoryPage() {
  return (
    <ClientOnly>
      <ComingSoonPage
        icon={<Receipt className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
        title="Payment History"
        description="Payment tracking will be available once online payment processing is implemented. All current services are FREE."
        backHref="/dashboard"
      />
    </ClientOnly>
  )
}
