"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useDelivery } from "@/lib/delivery-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeliveryStatusBadge } from "@/components/delivery-status-badge"
import { DeliveryTimeline } from "@/components/delivery-timeline"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  Phone,
  Building,
  Edit,
  XCircle,
} from "lucide-react"
import type { DeliveryTimeSlot } from "@/lib/delivery-context"

export default function DeliveryStatusPage() {
  const router = useRouter()
  const params = useParams()
  const deliveryId = params.id as string

  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    getDeliveryRequestById,
    rescheduleDelivery,
    updateDeliveryAddress,
    refreshDeliveryRequests,
    isLoaded,
  } = useDelivery()

  // State
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [newTimeSlot, setNewTimeSlot] = useState<DeliveryTimeSlot | "">("")
  const [newStreetAddress, setNewStreetAddress] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState("")

  // Get delivery request
  const deliveryRequest = getDeliveryRequestById(deliveryId)

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Pre-fill address for edit
  useEffect(() => {
    if (deliveryRequest) {
      setNewStreetAddress(deliveryRequest.deliveryStreetAddress)
    }
  }, [deliveryRequest])

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const today = new Date()
    today.setDate(today.getDate() + 1)
    return today.toISOString().split("T")[0]
  }

  // Handle reschedule
  const handleReschedule = async () => {
    if (!newDate || !newTimeSlot || !deliveryRequest) return

    setIsUpdating(true)
    setUpdateError("")

    try {
      const success = await rescheduleDelivery(deliveryId, newDate, newTimeSlot)
      if (success) {
        setShowRescheduleDialog(false)
        setNewDate("")
        setNewTimeSlot("")
      } else {
        setUpdateError("Failed to reschedule. Please try again.")
      }
    } catch (err) {
      setUpdateError("An error occurred. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle address update
  const handleAddressUpdate = async () => {
    if (!newStreetAddress || !deliveryRequest) return

    setIsUpdating(true)
    setUpdateError("")

    try {
      const success = await updateDeliveryAddress(deliveryId, {
        province: deliveryRequest.deliveryProvince,
        provinceCode: deliveryRequest.deliveryProvinceCode,
        city: deliveryRequest.deliveryCity,
        cityCode: deliveryRequest.deliveryCityCode,
        barangay: deliveryRequest.deliveryBarangay,
        barangayCode: deliveryRequest.deliveryBarangayCode,
        streetAddress: newStreetAddress,
        zipCode: deliveryRequest.deliveryZipCode,
        landmark: deliveryRequest.deliveryLandmark,
      })
      if (success) {
        setShowAddressDialog(false)
      } else {
        setUpdateError("Failed to update address. Please try again.")
      }
    } catch (err) {
      setUpdateError("An error occurred. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeSlot?: string) => {
    if (!timeSlot) return ""
    const times: Record<string, string> = {
      morning: "8:00 AM - 12:00 PM",
      afternoon: "12:00 PM - 5:00 PM",
      evening: "5:00 PM - 8:00 PM",
    }
    return times[timeSlot] || timeSlot
  }

  // Loading state
  if (authLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  // Not found
  if (!deliveryRequest) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="border-0 shadow-md max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">
              This delivery request does not exist or you don't have access to it.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canReschedule =
    deliveryRequest.status === "delivery_failed" && deliveryRequest.failureReason === "not_home"
  const canUpdateAddress =
    deliveryRequest.status === "delivery_failed" && deliveryRequest.failureReason === "wrong_address"
  const canConfirm = deliveryRequest.status === "out_for_delivery"
  const isDelivered = deliveryRequest.status === "delivered"
  const isPickupRequired = deliveryRequest.status === "pickup_required"

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
          <div className="flex items-center gap-2 flex-1">
            <Truck className="h-5 w-5 text-emerald-600" />
            <h1 className="text-base font-bold text-gray-900">Delivery Status</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refreshDeliveryRequests()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-lg mx-auto">
        <div className="space-y-4">
          {/* Status Header */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <DeliveryStatusBadge status={deliveryRequest.status} size="lg" />
                <span className="text-xs font-mono text-gray-400">
                  {deliveryRequest.id.slice(0, 8)}...
                </span>
              </div>

              {/* Status specific messages */}
              {deliveryRequest.status === "requested" && (
                <p className="text-sm text-gray-600">
                  Your delivery request has been received and is being processed.
                </p>
              )}
              {deliveryRequest.status === "printing" && (
                <p className="text-sm text-gray-600">
                  Your ID card is currently being printed. This usually takes 1-2 business days.
                </p>
              )}
              {deliveryRequest.status === "printed" && (
                <p className="text-sm text-gray-600">
                  Your ID card has been printed and is ready for delivery.
                </p>
              )}
              {deliveryRequest.status === "out_for_delivery" && (
                <p className="text-sm text-emerald-600 font-medium">
                  Your ID is out for delivery! Please be ready to receive it.
                </p>
              )}
              {isDelivered && (
                <p className="text-sm text-emerald-600 font-medium">
                  Your ID has been delivered successfully!
                </p>
              )}
              {isPickupRequired && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700">
                    After multiple delivery attempts, your ID is now available for pickup at the
                    barangay office.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Failed Delivery Actions */}
          {deliveryRequest.status === "delivery_failed" && (
            <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Delivery Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  {deliveryRequest.failureReason === "not_home" &&
                    "We tried to deliver but you were not home. Please reschedule your delivery."}
                  {deliveryRequest.failureReason === "wrong_address" &&
                    "We could not find your address. Please verify and update your delivery address."}
                  {deliveryRequest.failureReason === "refused" &&
                    "The delivery was refused. Please contact the barangay office."}
                </p>
                <p className="text-xs text-gray-500">
                  Failed attempts: {deliveryRequest.failedAttempts}/2
                </p>

                <div className="flex gap-2">
                  {canReschedule && (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowRescheduleDialog(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                  )}
                  {canUpdateAddress && (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowAddressDialog(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Address
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Delivery CTA */}
          {canConfirm && (
            <Card className="border-0 shadow-sm bg-emerald-50">
              <CardContent className="p-4">
                <p className="text-sm text-emerald-700 mb-3">
                  Have you received your ID? Confirm delivery to complete the process.
                </p>
                <Link href={`/delivery/confirm/${deliveryId}`}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Delivery
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryTimeline request={deliveryRequest} />
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Delivery Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {deliveryRequest.deliveryStreetAddress}
                </p>
                <p className="text-sm text-gray-600">
                  {deliveryRequest.deliveryBarangay}, {deliveryRequest.deliveryCity}
                </p>
                <p className="text-sm text-gray-600">
                  {deliveryRequest.deliveryProvince}
                  {deliveryRequest.deliveryZipCode && ` ${deliveryRequest.deliveryZipCode}`}
                </p>
                {deliveryRequest.deliveryLandmark && (
                  <p className="text-xs text-gray-500 mt-1">
                    Landmark: {deliveryRequest.deliveryLandmark}
                  </p>
                )}
              </div>

              {/* Preferred Date/Time */}
              {(deliveryRequest.preferredDate || deliveryRequest.preferredTimeSlot) && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Preferred Schedule</p>
                  <div className="flex items-center gap-4 text-sm">
                    {deliveryRequest.preferredDate && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(deliveryRequest.preferredDate)}
                      </span>
                    )}
                    {deliveryRequest.preferredTimeSlot && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {formatTime(deliveryRequest.preferredTimeSlot)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Type */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Delivery Type</p>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  {deliveryRequest.deliveryType === "delivery" ? (
                    <>
                      <Truck className="h-4 w-4 text-emerald-600" />
                      Home Delivery
                    </>
                  ) : (
                    <>
                      <Building className="h-4 w-4 text-emerald-600" />
                      Office Pickup
                    </>
                  )}
                </p>
              </div>

              {/* Notes */}
              {deliveryRequest.deliveryNotes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Delivery Notes</p>
                  <p className="text-sm text-gray-600">{deliveryRequest.deliveryNotes}</p>
                </div>
              )}

              {/* Request Date */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Request Date</p>
                <p className="text-sm text-gray-600">{formatDate(deliveryRequest.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                Have questions about your delivery? Contact the barangay office.
              </p>
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Contact Barangay Office
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Delivery</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={getMinDate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <Select value={newTimeSlot} onValueChange={(v) => setNewTimeSlot(v as DeliveryTimeSlot)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8AM-12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                  <SelectItem value="evening">Evening (5PM-8PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {updateError && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {updateError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleReschedule}
              disabled={!newDate || !newTimeSlot || isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Reschedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Update Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Address</DialogTitle>
            <DialogDescription>
              Update your street address for delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={newStreetAddress}
                onChange={(e) => setNewStreetAddress(e.target.value)}
                placeholder="House/Lot No., Street, Purok"
              />
            </div>
            <p className="text-xs text-gray-500">
              Note: Only the street address can be updated. For barangay/city changes, please
              contact the barangay office.
            </p>
            {updateError && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {updateError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddressUpdate}
              disabled={!newStreetAddress || isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Address"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
