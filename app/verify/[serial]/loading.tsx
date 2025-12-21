export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
        <p className="text-sm font-medium text-gray-500 animate-pulse">Verifying certificate...</p>
      </div>
    </div>
  )
}
