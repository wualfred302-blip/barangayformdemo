"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useBlotters } from "@/lib/blotter-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Shield } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

const INCIDENT_TYPES = [
  "Noise Complaint",
  "Property Dispute",
  "Physical Altercation",
  "Verbal Abuse",
  "Theft",
  "Vandalism",
  "Domestic Dispute",
  "Trespassing",
  "Animal Complaint",
  "Infrastructure/Lighting",
  "Other",
]

export default function BlotterPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addBlotter } = useBlotters()
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [blotterNumber, setBlotterNumber] = useState("")

  const [formData, setFormData] = useState({
    complainantName: user?.fullName || "",
    complainantContact: user?.mobileNumber || "",
    complainantAddress: user?.address || "",
    respondentName: "",
    respondentAddress: "",
    incidentType: "",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "",
    incidentLocation: "",
    narrative: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newBlotter = addBlotter({
      complainantName: isAnonymous ? "Anonymous" : formData.complainantName || "Anonymous",
      complainantContact: isAnonymous ? undefined : formData.complainantContact,
      complainantAddress: isAnonymous ? undefined : formData.complainantAddress,
      respondentName: formData.respondentName || undefined,
      respondentAddress: formData.respondentAddress || undefined,
      incidentType: formData.incidentType || "Other",
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime || undefined,
      incidentLocation: formData.incidentLocation || "Barangay Mawaque",
      narrative: formData.narrative || "No details provided",
      isAnonymous,
      status: "filed",
    })

    setBlotterNumber(newBlotter.blotterNumber)
    setIsSuccess(true)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-50 px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Report Filed</h1>
          <p className="mt-2 text-slate-600">Your blotter report has been recorded.</p>
          <Card className="mt-6 w-full max-w-xs border-0 bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-slate-500">Blotter Number</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{blotterNumber}</p>
              <p className="mt-3 text-xs text-slate-400">
                Save this number for tracking. A barangay official will contact you if needed.
              </p>
            </CardContent>
          </Card>
          <Button asChild className="mt-8 bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h1 className="text-lg font-semibold text-slate-900">File a Blotter</h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-6 pb-32">
        {/* Info Card */}
        <Card className="mb-6 border-0 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">Confidential Reporting</p>
                <p className="mt-1 text-xs text-amber-700">
                  Your report will be handled by barangay officials. You may choose to report anonymously.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Anonymous Toggle */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Report Anonymously</p>
                  <p className="text-sm text-slate-500">Your identity will not be recorded</p>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            </CardContent>
          </Card>

          {/* Complainant Info */}
          {!isAnonymous && (
            <Card className="border-0 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <h3 className="font-semibold text-slate-900">Complainant Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="complainantName">Full Name</Label>
                  <Input
                    id="complainantName"
                    value={formData.complainantName}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantContact">Contact Number</Label>
                  <Input
                    id="complainantContact"
                    value={formData.complainantContact}
                    onChange={(e) => setFormData({ ...formData, complainantContact: e.target.value })}
                    placeholder="+63 912 345 6789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantAddress">Address</Label>
                  <Input
                    id="complainantAddress"
                    value={formData.complainantAddress}
                    onChange={(e) => setFormData({ ...formData, complainantAddress: e.target.value })}
                    placeholder="Your address"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Respondent Info */}
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <h3 className="font-semibold text-slate-900">Respondent Information (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="respondentName">Name of Person Involved</Label>
                <Input
                  id="respondentName"
                  value={formData.respondentName}
                  onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                  placeholder="If known"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondentAddress">Address</Label>
                <Input
                  id="respondentAddress"
                  value={formData.respondentAddress}
                  onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value })}
                  placeholder="If known"
                />
              </div>
            </CardContent>
          </Card>

          {/* Incident Details */}
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <h3 className="font-semibold text-slate-900">Incident Details</h3>

              <div className="space-y-2">
                <Label>Type of Incident</Label>
                <Select
                  value={formData.incidentType}
                  onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Date</Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incidentTime">Time (Optional)</Label>
                  <Input
                    id="incidentTime"
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentLocation">Location</Label>
                <Input
                  id="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={(e) => setFormData({ ...formData, incidentLocation: e.target.value })}
                  placeholder="Where did this happen?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="narrative">Narrative / Description</Label>
                <Textarea
                  id="narrative"
                  value={formData.narrative}
                  onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                  placeholder="Please describe what happened in detail..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-xl bg-amber-500 text-base font-semibold text-white hover:bg-amber-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Filing Report...
              </>
            ) : (
              "Submit Blotter Report"
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}
