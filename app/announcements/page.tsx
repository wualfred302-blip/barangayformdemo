"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useAnnouncements, type AnnouncementCategory } from "@/lib/announcements-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Megaphone,
  Pin,
  Calendar,
  User,
  Heart,
  Activity,
  AlertCircle,
  Newspaper,
  ChevronRight,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

const CATEGORIES: { value: AnnouncementCategory | "all"; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "all", label: "All", icon: <Newspaper className="h-4 w-4" />, color: "bg-slate-100 text-slate-700" },
  { value: "general", label: "General", icon: <Megaphone className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" },
  { value: "health", label: "Health", icon: <Heart className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-700" },
  {
    value: "emergency",
    label: "Emergency",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700",
  },
  { value: "event", label: "Events", icon: <Calendar className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  { value: "notice", label: "Notices", icon: <Activity className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
]

export default function AnnouncementsPage() {
  const { getPublishedAnnouncements } = useAnnouncements()
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | "all">("all")

  const announcements = getPublishedAnnouncements().filter(
    (ann) => selectedCategory === "all" || ann.category === selectedCategory,
  )

  const getCategoryStyle = (category: AnnouncementCategory) => {
    return CATEGORIES.find((c) => c.value === category)?.color || "bg-slate-100 text-slate-700"
  }

  const getCategoryIcon = (category: AnnouncementCategory) => {
    const cat = CATEGORIES.find((c) => c.value === category)
    return cat?.icon || <Megaphone className="h-4 w-4" />
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
            <Megaphone className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-semibold text-slate-900">Announcements</h1>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 ${
                selectedCategory === category.value
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {category.icon}
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 px-4 py-6 pb-28">
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Link key={ann.id} href={`/announcements/${ann.id}`}>
              <Card
                className={`border-0 shadow-sm transition-shadow hover:shadow-md ${ann.priority === "urgent" ? "ring-2 ring-red-200" : ""}`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${getCategoryStyle(ann.category)}`}
                      >
                        {getCategoryIcon(ann.category)}
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getCategoryStyle(ann.category)}`}>
                        {ann.category}
                      </span>
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </span>
                      )}
                      {ann.priority === "urgent" && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          Urgent
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>

                  {/* Title & Content */}
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{ann.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{ann.content}</p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="h-3 w-3" />
                      <span>{ann.authorName || "Barangay Office"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {announcements.length === 0 && (
            <div className="py-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No announcements in this category</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
