"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Mail, User, Crown, FileText, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: "captain" | "secretary" | "treasurer"
  is_active: boolean
}

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from("staff")
        .select("*")
        .eq("is_active", true)
        .order("role", { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setStaff(data || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching staff:", err)
      setError("Failed to load staff directory. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "captain":
        return {
          title: "Punong Barangay (Captain)",
          icon: Crown,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        }
      case "secretary":
        return {
          title: "Barangay Secretary",
          icon: FileText,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        }
      case "treasurer":
        return {
          title: "Barangay Treasurer",
          icon: Wallet,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
        }
      default:
        return {
          title: "Staff Member",
          icon: User,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading staff directory...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/directory" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-2 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="h-10 w-10 text-emerald-600" />
            Staff & Officials Directory
          </h1>
          <p className="text-gray-600 text-lg">
            Contact information for barangay officials and staff members
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Staff Grid */}
        {staff.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No staff members found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => {
              const roleInfo = getRoleInfo(member.role)
              const RoleIcon = roleInfo.icon

              return (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${roleInfo.bgColor}`}>
                        <RoleIcon className={`h-8 w-8 ${roleInfo.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {member.full_name}
                        </CardTitle>
                        <p className={`text-sm font-medium ${roleInfo.color}`}>
                          {roleInfo.title}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <a
                          href={`mailto:${member.email}`}
                          className="text-sm hover:text-emerald-600 hover:underline"
                        >
                          {member.email}
                        </a>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Available during office hours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 space-y-6">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Office Hours
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              The barangay office is open Monday to Friday, 8:00 AM to 5:00 PM.
              For urgent matters outside office hours, please contact the barangay captain directly.
            </p>
          </div>

          <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              How to Reach Us
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              You can visit the barangay office in person, send an email to any of our staff members,
              or call the main office line. For document requests and certificates, please visit during
              office hours with valid identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
