"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useDelivery, type DeliveryRequest, type DeliveryStatus, type DeliveryFailureReason } from "@/lib/delivery-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeliveryStatusBadge } from "@/components/delivery-status-badge"
import { DeliveryTimelineCompact } from "@/components/delivery-timeline"
import {
  ArrowLeft,
  Search,
  Truck,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  Clock,
  Download,
  Printer,
  Package,
  CheckCircle2,
  XCircle,
  MoreVertical,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  User,
} from "lucide-react"

export default function DeliveryManagementPage() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading: authLoading } = useAuth()
  const {
    deliveryRequests,
    isLoaded,
    updateDeliveryStatus,
    markSentToPrint,
    markPrinted,
    refreshDeliveryRequests,
  } = useDelivery()

  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false)
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<DeliveryRequest | null>(null)
  const [failureReason, setFailureReason] = useState<DeliveryFailureReason>("not_home")
  const [isProcessing, setIsProcessing] = useState(false)

  // Auth check
  useEffect(() => {
    if (!authLoading && !isStaffAuthenticated) {
      router.push("/staff/login")
    }
  }, [authLoading, isStaffAuthenticated, router])

  // Filter requests
  const filteredRequests = useMemo(() => {
    return deliveryRequests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        req.deliveryStreetAddress.toLowerCase().includes(search.toLowerCase()) ||
        req.deliveryBarangay.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === "all" || req.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [deliveryRequests, search, statusFilter])

  // Stats
  const stats = useMemo(() => ({
    requested: deliveryRequests.filter((r) => r.status === "requested").length,
    printing: deliveryRequests.filter((r) => r.status === "printing").length,
    printed: deliveryRequests.filter((r) => r.status === "printed").length,
    out_for_delivery: deliveryRequests.filter((r) => r.status === "out_for_delivery").length,
    delivered: deliveryRequests.filter((r) => r.status === "delivered").length,
    delivery_failed: deliveryRequests.filter((r) => r.status === "delivery_failed").length,
    pickup_required: deliveryRequests.filter((r) => r.status === "pickup_required").length,
  }), [deliveryRequests])

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRequests.map((r) => r.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  // Bulk actions
  const handleBulkSendToPrint = async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    const ids = Array.from(selectedIds).filter((id) => {
      const req = deliveryRequests.find((r) => r.id === id)
      return req?.status === "requested"
    })
    if (ids.length > 0) {
      await markSentToPrint(ids)
    }
    clearSelection()
    setIsProcessing(false)
  }

  const handleBulkMarkPrinted = async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    const ids = Array.from(selectedIds).filter((id) => {
      const req = deliveryRequests.find((r) => r.id === id)
      return req?.status === "printing"
    })
    if (ids.length > 0) {
      await markPrinted(ids)
    }
    clearSelection()
    setIsProcessing(false)
  }

  // Single item actions
  const handleStatusUpdate = async (id: string, status: DeliveryStatus, reason?: DeliveryFailureReason) => {
    setIsProcessing(true)
    await updateDeliveryStatus(id, status, {
      failureReason: reason,
      staffName: staffUser?.fullName || "Staff",
    })
    setIsProcessing(false)
    setIsFailedDialogOpen(false)
    setSelectedRequestForAction(null)
  }

  // Export to CSV
  const exportToCSV = () => {
    const requestsToExport = selectedIds.size > 0
      ? deliveryRequests.filter((r) => selectedIds.has(r.id))
      : filteredRequests

    const headers = [
      "ID",
      "Status",
      "Province",
      "City",
      "Barangay",
      "Street Address",
      "ZIP Code",
      "Landmark",
      "Preferred Date",
      "Preferred Time",
      "Created At",
    ]

    const rows = requestsToExport.map((req) => [
      req.id,
      req.status,
      req.deliveryProvince,
      req.deliveryCity,
      req.deliveryBarangay,
      req.deliveryStreetAddress,
      req.deliveryZipCode || "",
      req.deliveryLandmark || "",
      req.preferredDate || "",
      req.preferredTimeSlot || "",
      new Date(req.createdAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `delivery-requests-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setIsExportDialogOpen(false)
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Loading state
  if (authLoading || !isStaffAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const kanbanStatuses: DeliveryStatus[] = [
    "requested",
    "printing",
    "printed",
    "out_for_delivery",
    "delivered",
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/staff/${staffUser?.role || "captain"}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            <h1 className="text-sm font-bold text-gray-900">ID Delivery Management</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => refreshDeliveryRequests()}
              disabled={!isLoaded}
            >
              <RefreshCw className={`h-4 w-4 ${!isLoaded ? "animate-spin" : ""}`} />
            </Button>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "kanban" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="border-0 bg-blue-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-blue-700">Requested</p>
              <p className="text-lg font-bold text-blue-900">{stats.requested}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-purple-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-purple-700">Printing</p>
              <p className="text-lg font-bold text-purple-900">{stats.printing}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-amber-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-amber-700">Out</p>
              <p className="text-lg font-bold text-amber-900">{stats.out_for_delivery}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-emerald-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-emerald-700">Delivered</p>
              <p className="text-lg font-bold text-emerald-900">{stats.delivered}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="printing">Printing</SelectItem>
              <SelectItem value="printed">Printed</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="delivery_failed">Failed</SelectItem>
              <SelectItem value="pickup_required">Pickup Required</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
            <span className="text-xs font-medium text-emerald-700">
              {selectedIds.size} selected
            </span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleBulkSendToPrint}
              disabled={isProcessing}
            >
              <Printer className="h-3 w-3 mr-1" />
              Send to Print
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleBulkMarkPrinted}
              disabled={isProcessing}
            >
              <Package className="h-3 w-3 mr-1" />
              Mark Printed
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-500"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4">
        {!isLoaded ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No delivery requests found</p>
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-xs text-gray-500">Select all</span>
            </div>

            {filteredRequests.map((req) => (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(req.id)}
                      onCheckedChange={() => toggleSelection(req.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <DeliveryStatusBadge status={req.status} size="sm" />
                            {req.deliveryType === "pickup" && (
                              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                                PICKUP
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-gray-400">{req.id.slice(0, 8)}...</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {req.status === "requested" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(req.id, "printing")}
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                Send to Print
                              </DropdownMenuItem>
                            )}
                            {req.status === "printing" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(req.id, "printed")}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Mark as Printed
                              </DropdownMenuItem>
                            )}
                            {req.status === "printed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(req.id, "out_for_delivery")}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Out for Delivery
                              </DropdownMenuItem>
                            )}
                            {req.status === "out_for_delivery" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(req.id, "delivered")}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark Delivered
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRequestForAction(req)
                                    setIsFailedDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            {(req.status === "delivery_failed" || req.status === "pickup_required") && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(req.id, "printed")}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Delivery
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {req.deliveryStreetAddress}
                          </p>
                          <p className="text-xs text-gray-500">
                            {req.deliveryBarangay}, {req.deliveryCity}, {req.deliveryProvince}
                          </p>
                        </div>
                      </div>

                      {/* Timeline & Dates */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(req.createdAt)}
                          </span>
                          {req.preferredDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {req.preferredDate} ({req.preferredTimeSlot})
                            </span>
                          )}
                        </div>
                        <DeliveryTimelineCompact status={req.status} />
                      </div>

                      {/* Failure reason */}
                      {req.status === "delivery_failed" && req.failureReason && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          {req.failureReason === "not_home" && "Not home"}
                          {req.failureReason === "wrong_address" && "Wrong address"}
                          {req.failureReason === "refused" && "Refused"}
                          <span className="text-gray-400">
                            (Attempt {req.failedAttempts}/2)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStatuses.map((status) => {
              const statusRequests = filteredRequests.filter((r) => r.status === status)
              return (
                <div key={status} className="w-[280px] shrink-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase text-gray-500">
                      {status.replace(/_/g, " ")}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {statusRequests.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {statusRequests.map((req) => (
                      <Card key={req.id} className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <DeliveryStatusBadge status={req.status} size="sm" />
                            {req.deliveryType === "pickup" && (
                              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                                PICKUP
                              </span>
                            )}
                          </div>

                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {req.deliveryStreetAddress}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {req.deliveryBarangay}, {req.deliveryCity}
                            </p>
                          </div>

                          {req.preferredDate && (
                            <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {req.preferredDate}
                            </p>
                          )}

                          {/* Action buttons based on status */}
                          {status === "requested" && (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleStatusUpdate(req.id, "printing")}
                              disabled={isProcessing}
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              Send to Print
                            </Button>
                          )}
                          {status === "printing" && (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => handleStatusUpdate(req.id, "printed")}
                              disabled={isProcessing}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Mark Printed
                            </Button>
                          )}
                          {status === "printed" && (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs bg-amber-600 hover:bg-amber-700"
                              onClick={() => handleStatusUpdate(req.id, "out_for_delivery")}
                              disabled={isProcessing}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Out for Delivery
                            </Button>
                          )}
                          {status === "out_for_delivery" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleStatusUpdate(req.id, "delivered")}
                                disabled={isProcessing}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Done
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedRequestForAction(req)
                                  setIsFailedDialogOpen(true)
                                }}
                                disabled={isProcessing}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {status === "delivered" && (
                            <div className="text-center text-xs text-emerald-600 font-medium py-1">
                              <CheckCircle2 className="h-4 w-4 inline mr-1" />
                              Complete
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {statusRequests.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-xs">No requests</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Failed / Pickup Required Column */}
            <div className="w-[280px] shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-red-500">Issues</h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                  {stats.delivery_failed + stats.pickup_required}
                </span>
              </div>
              <div className="space-y-2">
                {filteredRequests
                  .filter((r) => r.status === "delivery_failed" || r.status === "pickup_required")
                  .map((req) => (
                    <Card key={req.id} className="border-0 shadow-sm border-l-2 border-l-red-400">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <DeliveryStatusBadge status={req.status} size="sm" />
                        </div>

                        <p className="text-xs font-medium text-gray-900 truncate mb-1">
                          {req.deliveryStreetAddress}
                        </p>

                        {req.failureReason && (
                          <p className="text-[10px] text-red-600 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {req.failureReason === "not_home" && "Not home"}
                            {req.failureReason === "wrong_address" && "Wrong address"}
                            {req.failureReason === "refused" && "Refused"}
                          </p>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs"
                          onClick={() => handleStatusUpdate(req.id, "printed")}
                          disabled={isProcessing}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry Delivery
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Delivery Requests</DialogTitle>
            <DialogDescription>
              Export {selectedIds.size > 0 ? selectedIds.size : filteredRequests.length} requests
              to CSV format for the print queue.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              The export will include:
            </p>
            <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
              <li>Delivery addresses</li>
              <li>Preferred delivery dates and times</li>
              <li>Request status</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Failed Delivery Dialog */}
      <Dialog open={isFailedDialogOpen} onOpenChange={setIsFailedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Delivery as Failed</DialogTitle>
            <DialogDescription>
              Select the reason for the failed delivery attempt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Select
              value={failureReason}
              onValueChange={(v) => setFailureReason(v as DeliveryFailureReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_home">Not Home</SelectItem>
                <SelectItem value="wrong_address">Wrong Address</SelectItem>
                <SelectItem value="refused">Refused</SelectItem>
              </SelectContent>
            </Select>

            {selectedRequestForAction && selectedRequestForAction.failedAttempts >= 1 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  This is attempt #{selectedRequestForAction.failedAttempts + 1}. After 2 failed
                  attempts, the request will require office pickup.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFailedDialogOpen(false)
                setSelectedRequestForAction(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequestForAction) {
                  handleStatusUpdate(selectedRequestForAction.id, "delivery_failed", failureReason)
                }
              }}
              disabled={isProcessing}
            >
              Mark as Failed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
