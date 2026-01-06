import { CircleDollarSign } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function TaxesPage() {
  return (
    <ComingSoonPage
      title="Taxes & Payments"
      description="View and pay your barangay taxes, community dues, and other fees online. This service is coming soon."
      icon={<CircleDollarSign className="h-12 w-12 text-[#3B82F6] stroke-[1.5]" />}
    />
  )
}
