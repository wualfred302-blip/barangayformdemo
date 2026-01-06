import { ComingSoonPage } from "@/components/coming-soon-page"
import { HandHeart } from "lucide-react"

export default function BayanihanPage() {
  return (
    <ComingSoonPage
      title="Bayanihan Assistance"
      description="Request financial aid, medical assistance, and community support from the barangay. This service is currently being enhanced."
      icon={<HandHeart className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
    />
  )
}
