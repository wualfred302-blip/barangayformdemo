import { Loader2 } from "lucide-react"

export default function QrtIdListLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10B981] mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Loading your QRT IDs...</p>
      </div>
    </div>
  )
}
