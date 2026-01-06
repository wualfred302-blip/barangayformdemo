"use client"

import { useEffect } from "react"
import { AlertCircle, Home } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Dashboard Error Boundary
 *
 * Catches errors that occur in the dashboard page and displays a user-friendly
 * error message with a "Try Again" button that resets the page.
 *
 * This error boundary handles:
 * - Data fetching failures from contexts
 * - Rendering errors in dashboard components
 * - Context state errors
 */
export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development for debugging
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-500" strokeWidth={1.5} />
        </div>

        {/* Error Heading */}
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          Something went wrong
        </h1>

        {/* Error Description */}
        <p className="mb-8 text-base leading-relaxed text-gray-600">
          We encountered an error while loading your dashboard. Please try again,
          and if the problem persists, contact support.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-8 w-full rounded-lg bg-red-50 p-4 text-left">
            <p className="text-xs font-mono text-red-700">{error.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full flex-col gap-3">
          {/* Try Again Button */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] px-8 h-12 font-semibold text-white shadow-lg shadow-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
            aria-label="Try loading the dashboard again"
          >
            <span>Try Again</span>
          </button>

          {/* Back to Home Button */}
          <a
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 px-8 h-12 font-semibold text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            aria-label="Return to home page"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </a>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-400">
          If you continue to experience issues, please contact barangay support
        </p>
      </div>
    </div>
  )
}
