import { ComingSoonPage } from "@/components/coming-soon-page"
import { HandHeart } from "lucide-react"

export const dynamic = "force-dynamic"

export default function BayanihanPage() {
  return (
    <ComingSoonPage
      title="Bayanihan Assistance"
      description="Request financial aid, medical assistance, and community support from the barangay. This service is currently being enhanced."
      icon={<HandHeart className="h-8 w-8 text-blue-600" strokeWidth={1.5} />}
      backHref="/"
    />
  )
}
