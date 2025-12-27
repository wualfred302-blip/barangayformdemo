"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Search,
  Filter,
  IdCard,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Calendar,
  User,
  MapPin,
  Download
} from "lucide-react"
import { QRTStatusBadge } from "@/components/qrt-status-badge"

// Mock data
const MOCK_REQUESTS = [
  {
    id: "REQ-001",
    qrtCode: "QRT-2025-000001",
    fullName: "Juan Dela Cruz",
    address: "Purok 1, Mawaque",
    status: "processing",
    requestType: "rush",
    createdAt: "2025-01-15T08:00:00",
    photo: "/placeholder-user.jpg"
  },
  {
    id: "REQ-002",
    qrtCode: "QRT-2025-000002",
    fullName: "Maria Santos",
    address: "Purok 2, Mawaque",
    status: "ready",
    requestType: "regular",
    createdAt: "2025-01-14T10:30:00",
    photo: "/placeholder-user.jpg"
  },
  {
    id: "REQ-003",
    qrtCode: null,
    fullName: "Pedro Penduko",
    address: "Purok 3, Mawaque",
    status: "pending",
    requestType: "regular",
    createdAt: "2025-01-16T09:15:00",
    photo: "/placeholder-user.jpg"
  }
]

type QRTRequest = typeof MOCK_REQUESTS[0]

export default function QRTManagementPage() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading } = useAuth()
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [qrtRequests, setQrtRequests] = useState<QRTRequest[]>(MOCK_REQUESTS)

  useEffect(() => {
    if (!isLoading && (!isStaffAuthenticated || staffUser?.role !== "secretary")) {
      router.push("/staff/login")
    }
  }, [isLoading, isStaffAuthenticated, staffUser, router])

  if (isLoading || !isStaffAuthenticated || staffUser?.role !== "secretary") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const filteredRequests = qrtRequests.filter((req) => {
    const matchesSearch = 
      (req.qrtCode?.toLowerCase().includes(search.toLowerCase()) || false) ||
      req.fullName.toLowerCase().includes(search.toLowerCase()) ||
      req.address.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    const matchesType = typeFilter === 'all' || req.requestType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    pending: qrtRequests.filter(r => r.status === 'pending').length,
    processing: qrtRequests.filter(r => r.status === 'processing').length,
    ready: qrtRequests.filter(r => r.status === 'ready').length,
    issued: qrtRequests.filter(r => r.status === 'issued').length
  }

  const updateStatus = (id: string, newStatus: string) => {
    setQrtRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ))
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/staff/secretary">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-emerald-600" />
            <h1 className="text-sm font-bold text-gray-900">QRT ID Management</h1>
          </div>
          <div className="ml-auto flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="border-0 bg-amber-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-amber-700">Pending</p>
              <p className="text-lg font-bold text-amber-900">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-blue-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-blue-700">Process</p>
              <p className="text-lg font-bold text-blue-900">{stats.processing}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-emerald-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-emerald-700">Ready</p>
              <p className="text-lg font-bold text-emerald-900">{stats.ready}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-slate-50 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[10px] font-medium text-slate-700">Issued</p>
              <p className="text-lg font-bold text-slate-900">{stats.issued}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search request..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="rush">Rush</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="p-4">
        {viewMode === "list" ? (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        <Image src={req.photo} alt={req.fullName} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{req.fullName}</p>
                          {req.requestType === 'rush' && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                              RUSH
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{req.qrtCode || "No Code Assigned"}</p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {req.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <QRTStatusBadge status={req.status as any} size="sm" />
                      
                      {req.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => updateStatus(req.id, 'processing')}
                        >
                          Approve
                        </Button>
                      )}
                      {req.status === 'processing' && (
                        <Button 
                          size="sm" 
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateStatus(req.id, 'ready')}
                        >
                          Generate
                        </Button>
                      )}
                      {req.status === 'ready' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Issue
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {['pending', 'processing', 'ready'].map((status) => (
              <div key={status} className="w-[280px] shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">{status}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {filteredRequests.filter(r => r.status === status).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredRequests
                    .filter(r => r.status === status)
                    .map(req => (
                      <Card key={req.id} className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-100">
                                <Image src={req.photo} alt={req.fullName} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{req.fullName}</p>
                                <p className="text-[10px] text-gray-500">{req.id}</p>
                              </div>
                            </div>
                            {req.requestType === 'rush' && (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                RUSH
                              </span>
                            )}
                          </div>
                          
                          {status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => updateStatus(req.id, 'processing')}
                            >
                              Approve Request
                            </Button>
                          )}
                          {status === 'processing' && (
                            <Button 
                              size="sm" 
                              className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
                              onClick={() => updateStatus(req.id, 'ready')}
                            >
                              Generate ID
                            </Button>
                          )}
                          {status === 'ready' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              View & Issue
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
