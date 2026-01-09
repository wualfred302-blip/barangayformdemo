import { ComingSoonPage } from "@/components/coming-soon-page"
import { ClientOnly } from "@/components/client-only"
import { ShieldAlert } from "lucide-react"

export default function BlotterPage() {
  return (
    <ClientOnly>
      <ComingSoonPage
        title="File Blotter Report"
        description="Report incidents, file complaints, and access blotter records online. This feature is under development."
        icon={<ShieldAlert className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
      />
    </ClientOnly>
  )
}
