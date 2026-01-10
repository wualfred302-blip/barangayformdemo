"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { useQRT, type QRTIDRequest } from "@/lib/qrt-context"
import { useDelivery, type DeliveryTimeSlot } from "@/lib/delivery-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { AddressCombobox } from "@/components/address-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Camera,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  RefreshCw,
  X,
} from "lucide-react"

// Dynamically import SelfieCapture to avoid SSR issues
const SelfieCapture = dynamic(() => import("@/components/selfie-capture").then((mod) => mod.SelfieCapture), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-100 rounded-lg">
      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  ),
})

export default function DeliveryRequestPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { getUserQRTIds, isLoaded: qrtLoaded } = useQRT()
  const { createDeliveryRequest, getDeliveryRequestByQrtId } = useDelivery()

  // Form state
  const [selectedQrtId, setSelectedQrtId] = useState<string>("")
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")

  // Address state
  const [province, setProvince] = useState("")
  const [provinceCode, setProvinceCode] = useState("")
  const [city, setCity] = useState("")
  const [cityCode, setCityCode] = useState("")
  const [barangay, setBarangay] = useState("")
  const [barangayCode, setBarangayCode] = useState("")
  const [streetAddress, setStreetAddress] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [landmark, setLandmark] = useState("")

  // Delivery preferences
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<DeliveryTimeSlot | "">("")
  const [deliveryNotes, setDeliveryNotes] = useState("")

  // Selfie retake
  const [wantNewSelfie, setWantNewSelfie] = useState(false)
  const [showSelfieCapture, setShowSelfieCapture] = useState(false)
  const [newSelfieUrl, setNewSelfieUrl] = useState<string>("")

  // Terms
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdRequestId, setCreatedRequestId] = useState<string>("")

  // Get user's eligible QRT IDs
  const userQrtIds = user?.qrCode ? getUserQRTIds(user.qrCode) : []
  const eligibleQrtIds = userQrtIds.filter((qrt) => {
    // Only allow IDs that are ready/issued and don't have pending delivery
    const hasDelivery = getDeliveryRequestByQrtId(qrt.id)
    return (qrt.status === "ready" || qrt.status === "issued") && !hasDelivery
  })

  // Pre-fill address from user profile
  useEffect(() => {
    if (user) {
      if (user.province) setProvince(user.province)
      if (user.city_municipality) setCity(user.city_municipality)
      if (user.barangay) setBarangay(user.barangay)
      if (user.street) setStreetAddress(`${user.house_lot_no || ""} ${user.street || ""} ${user.purok || ""}`.trim())
      if (user.zip_code) setZipCode(user.zip_code)
    }
  }, [user])

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Handle selfie capture
  const handleSelfieCapture = useCallback((imageData: string) => {
    setNewSelfieUrl(imageData)
    setShowSelfieCapture(false)
  }, [])

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    today.setDate(today.getDate() + 1) // Minimum is tomorrow
    return today.toISOString().split("T")[0]
  }

  // Form validation
  const isFormValid = () => {
    if (!selectedQrtId) return false
    if (deliveryType === "delivery") {
      if (!province || !city || !barangay || !streetAddress) return false
    }
    if (!acceptedDisclaimer) return false
    return true
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!isFormValid() || !user) return

    setIsSubmitting(true)
    setError("")

    try {
      const selectedQrt = eligibleQrtIds.find((q) => q.id === selectedQrtId)
      if (!selectedQrt) {
        setError("Selected ID not found")
        return
      }

      const request = await createDeliveryRequest({
        qrtId: selectedQrtId,
        userId: user.qrCode || user.id || "",
        barangayCode: barangay, // Using barangay name as code for now

        deliveryProvince: province,
        deliveryProvinceCode: provinceCode,
        deliveryCity: city,
        deliveryCityCode: cityCode,
        deliveryBarangay: barangay,
        deliveryBarangayCode: barangayCode,
        deliveryStreetAddress: streetAddress,
        deliveryZipCode: zipCode,
        deliveryLandmark: landmark,

        preferredDate: preferredDate || undefined,
        preferredTimeSlot: preferredTimeSlot || undefined,
        deliveryNotes: deliveryNotes || undefined,
        deliveryType,

        updatedPhotoUrl: newSelfieUrl || undefined,
      })

      if (request) {
        setCreatedRequestId(request.id)
        setShowSuccessDialog(true)
      } else {
        setError("Failed to create delivery request. Please try again.")
      }
    } catch (err) {
      console.error("Error creating delivery request:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (authLoading || !qrtLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            <h1 className="text-base font-bold text-gray-900">Request ID Delivery</h1>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-lg mx-auto">
        {/* No Eligible IDs Message */}
        {eligibleQrtIds.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Eligible IDs</h2>
              <p className="text-sm text-gray-500 mb-4">
                You don't have any IDs that are ready for delivery, or all your IDs already have
                pending delivery requests.
              </p>
              <Link href="/qrt-id/request">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Request New ID
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select ID */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Select ID for Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup value={selectedQrtId} onValueChange={setSelectedQrtId}>
                  {eligibleQrtIds.map((qrt) => (
                    <div
                      key={qrt.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedQrtId === qrt.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                      onClick={() => setSelectedQrtId(qrt.id)}
                    >
                      <RadioGroupItem value={qrt.id} id={qrt.id} />
                      <div className="flex-1">
                        <Label htmlFor={qrt.id} className="text-sm font-medium cursor-pointer">
                          {qrt.qrtCode}
                        </Label>
                        <p className="text-xs text-gray-500">
                          Status: {qrt.status} • Created:{" "}
                          {new Date(qrt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Type */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  Delivery Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={deliveryType}
                  onValueChange={(v) => setDeliveryType(v as "delivery" | "pickup")}
                  className="grid grid-cols-2 gap-3"
                >
                  <div
                    className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      deliveryType === "delivery"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                    onClick={() => setDeliveryType("delivery")}
                  >
                    <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                    <div className="text-center">
                      <Truck className={`h-6 w-6 mx-auto mb-2 ${deliveryType === "delivery" ? "text-emerald-600" : "text-gray-400"}`} />
                      <Label htmlFor="delivery" className="text-sm font-medium cursor-pointer">
                        Home Delivery
                      </Label>
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      deliveryType === "pickup"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                    onClick={() => setDeliveryType("pickup")}
                  >
                    <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                    <div className="text-center">
                      <Building className={`h-6 w-6 mx-auto mb-2 ${deliveryType === "pickup" ? "text-emerald-600" : "text-gray-400"}`} />
                      <Label htmlFor="pickup" className="text-sm font-medium cursor-pointer">
                        Office Pickup
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Address (only for delivery type) */}
            {deliveryType === "delivery" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Delivery Address
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Where should we deliver your ID?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Province */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Province <span className="text-red-500">*</span>
                    </Label>
                    <AddressCombobox
                      type="province"
                      value={province}
                      onChange={(value, code) => {
                        setProvince(value)
                        setProvinceCode(code || "")
                        setCity("")
                        setCityCode("")
                        setBarangay("")
                        setBarangayCode("")
                      }}
                      placeholder="Select province"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      City/Municipality <span className="text-red-500">*</span>
                    </Label>
                    <AddressCombobox
                      type="city"
                      value={city}
                      onChange={(value, code, data) => {
                        setCity(value)
                        setCityCode(code || "")
                        if (data?.zip_code) setZipCode(data.zip_code)
                        setBarangay("")
                        setBarangayCode("")
                      }}
                      provinceCode={provinceCode}
                      placeholder="Select city"
                      disabled={!province}
                    />
                  </div>

                  {/* Barangay */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Barangay <span className="text-red-500">*</span>
                    </Label>
                    <AddressCombobox
                      type="barangay"
                      value={barangay}
                      onChange={(value, code) => {
                        setBarangay(value)
                        setBarangayCode(code || "")
                      }}
                      cityCode={cityCode}
                      placeholder="Select barangay"
                      disabled={!city}
                    />
                  </div>

                  {/* Street Address */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="House/Lot No., Street, Purok"
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* ZIP Code */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">ZIP Code</Label>
                      <Input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="ZIP"
                        className="text-sm"
                      />
                    </div>

                    {/* Landmark */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Landmark</Label>
                      <Input
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near..."
                        className="text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Preferences */}
            {deliveryType === "delivery" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Delivery Preferences
                  </CardTitle>
                  <CardDescription className="text-xs">Optional scheduling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Preferred Date */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Preferred Date</Label>
                      <Input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        min={getMinDate()}
                        className="text-sm"
                      />
                    </div>

                    {/* Preferred Time */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Preferred Time</Label>
                      <Select
                        value={preferredTimeSlot}
                        onValueChange={(v) => setPreferredTimeSlot(v as DeliveryTimeSlot)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (8AM-12PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                          <SelectItem value="evening">Evening (5PM-8PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Delivery Notes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Delivery Notes</Label>
                    <Textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any special instructions for the delivery person..."
                      className="text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Disclaimer */}
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      Delivery dates are estimates and subject to availability. We will notify you
                      of the actual delivery schedule.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Update Selfie (Optional) */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    Update Photo (Optional)
                  </CardTitle>
                  <Switch checked={wantNewSelfie} onCheckedChange={setWantNewSelfie} />
                </div>
                <CardDescription className="text-xs">
                  Take a new photo for your ID card before printing
                </CardDescription>
              </CardHeader>
              {wantNewSelfie && (
                <CardContent>
                  {newSelfieUrl ? (
                    <div className="relative">
                      <img
                        src={newSelfieUrl}
                        alt="New selfie"
                        className="w-full aspect-[3/4] object-cover rounded-lg"
                      />
                      <div className="absolute bottom-3 inset-x-3 flex gap-2">
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => setShowSelfieCapture(true)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retake
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setNewSelfieUrl("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute top-3 right-3">
                        <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Photo Ready
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-32 border-dashed"
                      onClick={() => setShowSelfieCapture(true)}
                    >
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Take New Photo</span>
                      </div>
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Terms */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="disclaimer"
                    checked={acceptedDisclaimer}
                    onCheckedChange={(checked) => setAcceptedDisclaimer(checked as boolean)}
                  />
                  <Label htmlFor="disclaimer" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                    I understand that delivery dates are estimates and the barangay will contact me
                    to confirm the actual delivery schedule. I confirm that the delivery address
                    provided is accurate.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5 mr-2" />
                  {deliveryType === "delivery" ? "Request Delivery" : "Request for Pickup"}
                </>
              )}
            </Button>

            {/* Free Service Note */}
            <p className="text-center text-xs text-gray-500">
              <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-500" />
              This service is free of charge
            </p>
          </div>
        )}
      </main>

      {/* Selfie Capture Dialog */}
      <Dialog open={showSelfieCapture} onOpenChange={setShowSelfieCapture}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Take New Photo</DialogTitle>
            <DialogDescription>
              Position your face within the frame and ensure good lighting.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <SelfieCapture onCapture={handleSelfieCapture} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center">Request Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your ID delivery request has been submitted successfully. You will receive
              notifications as your request progresses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push(`/delivery/${createdRequestId}`)}
            >
              Track Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
