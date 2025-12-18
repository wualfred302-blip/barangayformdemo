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
import { ArrowLeft, ShieldAlert, CheckCircle2, Loader2, Lock } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

const COMPLAINT_TYPES = [
  "Unauthorized Data Collection",
  "Data Breach",
  "Improper Data Sharing",
  "Identity Theft",
  "Unauthorized Access",
  "Data Retention Violation",
  "Consent Violation",
  "Right to Access Denial",
  "Right to Erasure Denial",
  "Other Privacy Concern",
]

export default function DataPrivacyComplaintPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addBlotter } = useBlotters()
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [complaintNumber, setComplaintNumber] = useState("")

  const [formData, setFormData] = useState({
    complainantName: user?.fullName || "",
    complainantContact: user?.mobileNumber || "",
    complainantAddress: user?.address || "",
    respondentName: "",
    respondentAddress: "",
    complaintType: "",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "",
    incidentLocation: "",
    narrative: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newComplaint = addBlotter({
      complainantName: isAnonymous ? "Anonymous" : formData.complainantName || "Anonymous",
      complainantContact: isAnonymous ? undefined : formData.complainantContact,
      complainantAddress: isAnonymous ? undefined : formData.complainantAddress,
      respondentName: formData.respondentName || undefined,
      respondentAddress: formData.respondentAddress || undefined,
      incidentType: formData.complaintType || "Other Privacy Concern",
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime || undefined,
      incidentLocation: formData.incidentLocation || "Barangay Mawaque",
      narrative: formData.narrative || "No details provided",
      isAnonymous,
      status: "filed",
    })

    setComplaintNumber(newComplaint.blotterNumber)
    setIsSuccess(true)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-50 px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Complaint Filed</h1>
          <p className="mt-1 text-sm text-gray-600">Your data privacy complaint has been recorded.</p>
          <Card className="mt-4 w-full max-w-xs border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">Complaint Number</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">{complaintNumber}</p>
              <p className="mt-2 text-xs text-gray-400">
                Save this number for tracking. Our Data Privacy Officer will contact you.
              </p>
            </CardContent>
          </Card>
          <Button asChild className="mt-6 h-11 rounded-xl bg-emerald-500 px-8 hover:bg-emerald-600">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-100 bg-white px-4">
        <Link href="/dashboard" className="text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h1 className="text-base font-semibold text-gray-900">Data Privacy Complaint</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-28">
        <Card className="mb-4 border-0 bg-red-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Confidential Reporting</p>
                <p className="mt-0.5 text-xs text-red-700">
                  Your complaint will be handled by our Data Privacy Officer. You may report anonymously.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Anonymous Toggle */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Report Anonymously</p>
                  <p className="text-xs text-gray-500">Your identity will not be recorded</p>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            </CardContent>
          </Card>

          {/* Complainant Info */}
          {!isAnonymous && (
            <Card className="border-0 shadow-sm">
              <CardContent className="space-y-3 p-3">
                <h3 className="text-sm font-semibold text-gray-900">Your Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="complainantName" className="text-xs">
                    Full Name
                  </Label>
                  <Input
                    id="complainantName"
                    value={formData.complainantName}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                    placeholder="Your full name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantContact" className="text-xs">
                    Contact Number
                  </Label>
                  <Input
                    id="complainantContact"
                    value={formData.complainantContact}
                    onChange={(e) => setFormData({ ...formData, complainantContact: e.target.value })}
                    placeholder="+63 912 345 6789"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantAddress" className="text-xs">
                    Address
                  </Label>
                  <Input
                    id="complainantAddress"
                    value={formData.complainantAddress}
                    onChange={(e) => setFormData({ ...formData, complainantAddress: e.target.value })}
                    placeholder="Your address"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Respondent Info */}
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-3 p-3">
              <h3 className="text-sm font-semibold text-gray-900">Entity/Person Involved (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="respondentName" className="text-xs">
                  Name of Entity/Person
                </Label>
                <Input
                  id="respondentName"
                  value={formData.respondentName}
                  onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                  placeholder="If known"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondentAddress" className="text-xs">
                  Address/Location
                </Label>
                <Input
                  id="respondentAddress"
                  value={formData.respondentAddress}
                  onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value })}
                  placeholder="If known"
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Complaint Details */}
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-3 p-3">
              <h3 className="text-sm font-semibold text-gray-900">Complaint Details</h3>

              <div className="space-y-2">
                <Label className="text-xs">Type of Complaint</Label>
                <Select
                  value={formData.complaintType}
                  onValueChange={(value) => setFormData({ ...formData, complaintType: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select complaint type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate" className="text-xs">
                    Date
                  </Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incidentTime" className="text-xs">
                    Time (Optional)
                  </Label>
                  <Input
                    id="incidentTime"
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentLocation" className="text-xs">
                  Where did this occur?
                </Label>
                <Input
                  id="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={(e) => setFormData({ ...formData, incidentLocation: e.target.value })}
                  placeholder="Location or platform"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="narrative" className="text-xs">
                  Description of Privacy Violation
                </Label>
                <Textarea
                  id="narrative"
                  value={formData.narrative}
                  onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                  placeholder="Please describe the privacy violation in detail..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Filing Complaint...
              </>
            ) : (
              "Submit Privacy Complaint"
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}
