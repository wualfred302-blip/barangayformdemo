import { FileSignature } from "lucide-react"
import { ComingSoonPage } from "@/components/coming-soon-page"
import { ClientOnly } from "@/components/client-only"

export default function PermitsPage() {
  return (
    <ClientOnly>
      <ComingSoonPage
        title="Permits & Clearances"
        description="Apply for business permits, building permits, and other barangay clearances online. This feature will be available soon."
        icon={<FileSignature className="h-12 w-12 text-[#3B82F6] stroke-[1.5]" />}
      />
    </ClientOnly>
  )
}
