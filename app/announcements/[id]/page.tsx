"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAnnouncements, type AnnouncementCategory } from "@/lib/announcements-context"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Megaphone, Pin, Calendar, User, Heart, AlertCircle, Activity, QrCode, Share2 } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"

const getCategoryStyle = (category: AnnouncementCategory) => {
  switch (category) {
    case "health":
      return "bg-emerald-100 text-emerald-700"
    case "emergency":
      return "bg-red-100 text-red-700"
    case "event":
      return "bg-blue-100 text-blue-700"
    case "notice":
      return "bg-purple-100 text-purple-700"
    default:
      return "bg-amber-100 text-amber-700"
  }
}

const getCategoryIcon = (category: AnnouncementCategory) => {
  switch (category) {
    case "health":
      return <Heart className="h-4 w-4" />
    case "emergency":
      return <AlertCircle className="h-4 w-4" />
    case "event":
      return <Calendar className="h-4 w-4" />
    case "notice":
      return <Activity className="h-4 w-4" />
    default:
      return <Megaphone className="h-4 w-4" />
  }
}

export default function AnnouncementDetailPage() {
  const params = useParams()
  const { getAnnouncement } = useAnnouncements()
  const [announcement, setAnnouncement] = useState<ReturnType<typeof getAnnouncement>>(undefined)

  useEffect(() => {
    if (params.id) {
      const ann = getAnnouncement(params.id as string)
      setAnnouncement(ann)
    }
  }, [params.id, getAnnouncement])

  if (!announcement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Announcement not found</p>
          <Link href="/announcements" className="mt-4 inline-block text-sm font-medium text-emerald-600">
            Back to Announcements
          </Link>
        </div>
      </div>
    )
  }

  const qrData = JSON.stringify({
    type: "announcement",
    id: announcement.id,
    title: announcement.title,
    verify: `https://mawaque.gov.ph/announcements/${announcement.id}`,
  })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: announcement.title,
          text: announcement.content.substring(0, 100) + "...",
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/announcements" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Announcement</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5 text-slate-600" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-6 pb-28">
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-5">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${getCategoryStyle(announcement.category)}`}
              >
                {getCategoryIcon(announcement.category)}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryStyle(announcement.category)}`}
              >
                {announcement.category}
              </span>
              {announcement.isPinned && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
              {announcement.priority === "urgent" && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Urgent</span>
              )}
            </div>

            {/* Title */}
            <h2 className="mt-4 text-xl font-bold text-slate-900">{announcement.title}</h2>

            {/* Content */}
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">{announcement.content}</p>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="h-3 w-3" />
                <span>{announcement.authorName || "Barangay Office"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Verification QR Code</h3>
            </div>
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#111827"
                includeMargin={false}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">Scan this code to verify announcement authenticity</p>
            <p className="mt-1 text-[10px] text-slate-400">ID: {announcement.id}</p>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
