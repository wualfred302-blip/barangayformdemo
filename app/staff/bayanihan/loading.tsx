export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
