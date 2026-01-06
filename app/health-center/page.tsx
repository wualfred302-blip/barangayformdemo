import { Plus } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function HealthCenterPage() {
  return (
    <ComingSoonPage
      title="Health Center"
      description="Access health services, medical records, and schedule appointments with barangay health workers. This feature is under development."
      icon={<Plus className="h-12 w-12 text-[#3B82F6] stroke-[1.5]" />}
    />
  )
}
