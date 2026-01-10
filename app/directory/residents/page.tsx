"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Users, MapPin, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Resident {
  id: string
  full_name: string
  purok: string
  mobile_number: string
  barangay: string
  city_municipality: string
}

export default function ResidentsDirectoryPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPurok, setSelectedPurok] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const puroks = ["all", "1", "2", "3", "4", "5", "6", "7"]

  useEffect(() => {
    fetchResidents()
  }, [])

  useEffect(() => {
    filterResidents()
  }, [searchQuery, selectedPurok, residents])

  const fetchResidents = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from("residents")
        .select("id, full_name, purok, mobile_number, barangay, city_municipality")
        .order("full_name", { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setResidents(data || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching residents:", err)
      setError("Failed to load residents directory. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterResidents = () => {
    let filtered = residents

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((resident) =>
        resident.full_name.toLowerCase().includes(query)
      )
    }

    // Filter by purok
    if (selectedPurok !== "all") {
      filtered = filtered.filter((resident) => resident.purok === selectedPurok)
    }

    setFilteredResidents(filtered)
  }

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 4) return "***-****"
    return `***-***-${phone.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading residents directory...</p>
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
            <Users className="h-10 w-10 text-blue-600" />
            Residents Directory
          </h1>
          <p className="text-gray-600 text-lg">
            {filteredResidents.length} {filteredResidents.length === 1 ? "resident" : "residents"} found
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Purok Filter */}
          <div className="flex flex-wrap gap-2">
            {puroks.map((purok) => (
              <Button
                key={purok}
                variant={selectedPurok === purok ? "default" : "outline"}
                onClick={() => setSelectedPurok(purok)}
                className={selectedPurok === purok ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                {purok === "all" ? "All Puroks" : `Purok ${purok}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Residents Grid */}
        {filteredResidents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchQuery || selectedPurok !== "all"
                ? "No residents found matching your criteria."
                : "No residents registered yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResidents.map((resident) => (
              <Card key={resident.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {resident.full_name}
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Purok {resident.purok || "N/A"}
                          {resident.barangay && `, ${resident.barangay}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{maskPhoneNumber(resident.mobile_number)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Privacy & Data Protection
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Contact information is partially masked to protect resident privacy. Full contact details
            are only available to barangay officials. To request removal from the directory or update
            your information, please visit the barangay office.
          </p>
        </div>
      </div>
    </div>
  )
}
