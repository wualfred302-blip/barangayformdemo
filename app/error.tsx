"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
            <svg
              className="h-12 w-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Something went wrong!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full sm:w-auto"
          >
            Go to homepage
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-gray-900">
            <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-50">
              Error details (development only)
            </summary>
            <pre className="mt-2 overflow-x-auto text-sm text-gray-600 dark:text-gray-400">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
              {`\n\nStack:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
