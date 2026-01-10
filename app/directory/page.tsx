"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const directories = [
    {
      title: "Residents Directory",
      description: "Search and view registered residents by purok and name",
      icon: Users,
      href: "/directory/residents",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Staff Directory",
      description: "Contact information for barangay officials and staff members",
      icon: Shield,
      href: "/directory/staff",
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Barangay Directory
          </h1>
          <p className="text-gray-600 text-lg">
            Find and connect with residents and barangay officials
          </p>
        </div>

        {/* Global Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search across all directories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Directory Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {directories.map((directory) => {
            const Icon = directory.icon
            return (
              <Link key={directory.href} href={directory.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${directory.bgColor}`}>
                        <Icon className={`h-8 w-8 ${directory.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {directory.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {directory.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                      View Directory
                      <span className="text-lg">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Privacy Notice
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Directory information is limited to publicly available data. Personal contact information
            is only displayed for barangay officials and staff members. Residents can opt out of the
            directory by contacting the barangay office.
          </p>
        </div>
      </div>
    </div>
  )
}
