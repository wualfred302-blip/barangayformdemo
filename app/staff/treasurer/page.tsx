"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useCertificates } from "@/lib/certificate-context"
import { useBayanihan } from "@/lib/bayanihan-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  LogOut,
  TrendingUp,
  Banknote,
  Receipt,
  Calendar,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  HandHeart,
} from "lucide-react"
import Link from "next/link"

export default function TreasurerDashboard() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading, staffLogout } = useAuth()
  const { certificates } = useCertificates()
  const { requests, getPendingCount, getHighUrgencyCount } = useBayanihan()

  useEffect(() => {
    if (!isLoading && (!isStaffAuthenticated || staffUser?.role !== "treasurer")) {
      router.push("/staff/login")
    }
  }, [isLoading, isStaffAuthenticated, staffUser, router])

  if (isLoading || !isStaffAuthenticated || staffUser?.role !== "treasurer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const handleLogout = () => {
    staffLogout()
    router.push("/staff/login")
  }

  const totalRevenue = certificates.reduce((sum, c) => sum + c.amount, 0)
  const todayRevenue = certificates
    .filter((c) => new Date(c.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, c) => sum + c.amount, 0)
  const transactionCount = certificates.length
  const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0

  const revenueByType = certificates.reduce(
    (acc, cert) => {
      acc[cert.certificateType] = (acc[cert.certificateType] || 0) + cert.amount
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/logo.png" alt="Barangay Mawaque" fill className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Treasurer</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{staffUser.fullName}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-9 w-9 rounded-full bg-slate-100 p-0 text-gray-500"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 px-4 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">Financial Overview</h1>
          <p className="text-xs text-gray-500">Track revenue and transactions</p>
        </div>

        <Card className="mb-4 border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100">Total Revenue</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-white/80">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>+12.5% from last month</span>
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Card className="h-[72px] border-0 bg-amber-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-amber-700">
                <Banknote className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Today</span>
              </div>
              <p className="mt-1 text-lg font-bold text-amber-900">
                ₱{todayRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="h-[72px] border-0 bg-blue-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-blue-700">
                <Receipt className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Transactions</span>
              </div>
              <p className="mt-1 text-lg font-bold text-blue-900">{transactionCount}</p>
            </CardContent>
          </Card>

          <Card className="h-[72px] border-0 bg-emerald-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Avg. Amount</span>
              </div>
              <p className="mt-1 text-lg font-bold text-emerald-900">
                ₱{averageTransaction.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="h-[72px] border-0 bg-slate-100 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">This Month</span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900">
                ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="h-[72px] border-0 bg-emerald-50 shadow-sm col-span-2">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Digitally Signed</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="mt-1 text-lg font-bold text-emerald-900">
                  {certificates.filter((c) => c.staffSignature).length}
                </p>
                <p className="text-[10px] text-emerald-600">
                  out of {certificates.length} certificates
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[72px] border-0 bg-amber-50 shadow-sm col-span-2">
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-1.5 text-amber-700">
                <HandHeart className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Bayanihan (Budget Items)</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="mt-1 text-lg font-bold text-amber-900">
                  {requests.filter(r => 
                    r.status === 'pending' && 
                    ['Infrastructure Issue', 'Road/Street Problem', 'Flooding/Drainage'].includes(r.type)
                  ).length}
                </p>
                <p className="text-[10px] text-amber-600">
                  requires budget allocation
                </p>
              </div>
              {getHighUrgencyCount() > 0 && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {getHighUrgencyCount()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Type */}
        <Card className="mb-3 border-0 shadow-sm">
          <CardContent className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Revenue by Type</h3>
            <div className="space-y-2">
              {Object.entries(revenueByType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                  <span className="text-xs font-medium text-gray-700">{type}</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {Object.keys(revenueByType).length === 0 && (
                <p className="py-3 text-center text-xs text-gray-500">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget-Related Bayanihan */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Budget-Related Bayanihan</h3>
              <Link href="/staff/bayanihan">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:text-emerald-700">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {requests
                .filter(r => 
                  r.status === 'pending' && 
                  ['Infrastructure Issue', 'Road/Street Problem', 'Flooding/Drainage'].includes(r.type)
                )
                .slice(0, 3)
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        request.urgency === 'high' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        <HandHeart className={`h-3.5 w-3.5 ${
                          request.urgency === 'high' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{request.type}</p>
                        <p className="text-[10px] text-gray-500">{request.location}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      request.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {request.urgency}
                    </span>
                  </div>
                ))}
              {requests.filter(r => 
                r.status === 'pending' && 
                ['Infrastructure Issue', 'Road/Street Problem', 'Flooding/Drainage'].includes(r.type)
              ).length === 0 && (
                <p className="py-3 text-center text-xs text-gray-500">No budget items pending</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Transactions</h3>
            <div className="space-y-2">
              {certificates.slice(0, 5).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{cert.certificateType}</p>
                      <p className="text-[10px] text-gray-500">{cert.serialNumber}</p>
                      {cert.staffSignature && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Signed by {cert.signedBy?.split(" ")[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {cert.staffSignature && (
                    <img 
                      src={cert.staffSignature} 
                      alt="Signature" 
                      className="mr-2 h-6 w-auto opacity-50"
                    />
                  )}
                  <span className="text-sm font-semibold text-emerald-600">
                    +₱{cert.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {certificates.length === 0 && (
                <p className="py-3 text-center text-xs text-gray-500">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
