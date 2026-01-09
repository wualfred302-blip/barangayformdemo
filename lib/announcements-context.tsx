"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, memo, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"

export type AnnouncementCategory = "general" | "health" | "emergency" | "event" | "notice"
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent"

export interface Announcement {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  imageUrl?: string
  isPublished: boolean
  isPinned: boolean
  authorId?: string
  authorName?: string
  approvedBy?: string
  publishedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

interface AnnouncementsContextType {
  announcements: Announcement[]
  isLoading: boolean
  error: string | null
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => Promise<Announcement>
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  refreshAnnouncements: () => Promise<void>
  getPublishedAnnouncements: () => Announcement[]
  getAnnouncement: (id: string) => Announcement | undefined
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined)

// Transform snake_case from DB to camelCase for React
const transformAnnouncement = (dbAnnouncement: any): Announcement => ({
  id: dbAnnouncement.id,
  title: dbAnnouncement.title,
  content: dbAnnouncement.content,
  category: dbAnnouncement.category,
  priority: dbAnnouncement.priority,
  imageUrl: dbAnnouncement.image_url,
  isPublished: dbAnnouncement.is_published,
  isPinned: dbAnnouncement.is_pinned,
  authorId: dbAnnouncement.author_id,
  authorName: dbAnnouncement.author_name,
  approvedBy: dbAnnouncement.approved_by,
  publishedAt: dbAnnouncement.published_at,
  expiresAt: dbAnnouncement.expires_at,
  createdAt: dbAnnouncement.created_at,
  updatedAt: dbAnnouncement.updated_at,
})

// Transform camelCase from React to snake_case for DB
const transformToDb = (announcement: Partial<Announcement>): any => {
  const dbObj: any = {}
  if (announcement.title !== undefined) dbObj.title = announcement.title
  if (announcement.content !== undefined) dbObj.content = announcement.content
  if (announcement.category !== undefined) dbObj.category = announcement.category
  if (announcement.priority !== undefined) dbObj.priority = announcement.priority
  if (announcement.imageUrl !== undefined) dbObj.image_url = announcement.imageUrl
  if (announcement.isPublished !== undefined) dbObj.is_published = announcement.isPublished
  if (announcement.isPinned !== undefined) dbObj.is_pinned = announcement.isPinned
  if (announcement.authorId !== undefined) dbObj.author_id = announcement.authorId
  if (announcement.authorName !== undefined) dbObj.author_name = announcement.authorName
  if (announcement.approvedBy !== undefined) dbObj.approved_by = announcement.approvedBy
  if (announcement.publishedAt !== undefined) dbObj.published_at = announcement.publishedAt
  if (announcement.expiresAt !== undefined) dbObj.expires_at = announcement.expiresAt
  return dbObj
}

export const AnnouncementsProvider = memo(({ children }: { children: ReactNode }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Supabase client
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    )
  }, [])

  // Load announcements from Supabase
  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      const transformed = (data || []).map(transformAnnouncement)
      setAnnouncements(transformed)
    } catch (err) {
      console.error("Failed to load announcements:", err)
      setError(err instanceof Error ? err.message : "Failed to load announcements")
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Load announcements on mount
  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  // Add announcement to Supabase
  const addAnnouncement = useCallback(
    async (data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => {
      try {
        const dbData = transformToDb(data)

        const { data: newRecord, error: insertError } = await supabase
          .from("announcements")
          .insert([dbData])
          .select()
          .single()

        if (insertError) throw insertError

        const transformed = transformAnnouncement(newRecord)
        setAnnouncements((prev) => [transformed, ...prev])
        return transformed
      } catch (err) {
        console.error("Failed to add announcement:", err)
        throw err
      }
    },
    [supabase]
  )

  // Update announcement in Supabase
  const updateAnnouncement = useCallback(
    async (id: string, updates: Partial<Announcement>) => {
      try {
        const dbData = transformToDb(updates)

        const { error: updateError } = await supabase
          .from("announcements")
          .update(dbData)
          .eq("id", id)

        if (updateError) throw updateError

        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
        )
      } catch (err) {
        console.error("Failed to update announcement:", err)
        throw err
      }
    },
    [supabase]
  )

  // Delete announcement from Supabase
  const deleteAnnouncement = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase.from("announcements").delete().eq("id", id)

        if (deleteError) throw deleteError

        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      } catch (err) {
        console.error("Failed to delete announcement:", err)
        throw err
      }
    },
    [supabase]
  )

  // Refresh announcements from Supabase
  const refreshAnnouncements = useCallback(async () => {
    await loadAnnouncements()
  }, [loadAnnouncements])

  // Get published announcements (already filtered by query)
  const getPublishedAnnouncements = useCallback(() => {
    return announcements
      .filter((a) => a.isPublished && (!a.expiresAt || new Date(a.expiresAt) > new Date()))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
      })
  }, [announcements])

  // Get single announcement by ID
  const getAnnouncement = useCallback((id: string) => announcements.find((a) => a.id === id), [announcements])

  const value = useMemo(
    () => ({
      announcements,
      isLoading,
      error,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      refreshAnnouncements,
      getPublishedAnnouncements,
      getAnnouncement,
    }),
    [
      announcements,
      isLoading,
      error,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      refreshAnnouncements,
      getPublishedAnnouncements,
      getAnnouncement,
    ]
  )

  return <AnnouncementsContext.Provider value={value}>{children}</AnnouncementsContext.Provider>
})

AnnouncementsProvider.displayName = "AnnouncementsProvider"

export function useAnnouncements() {
  const context = useContext(AnnouncementsContext)
  if (context === undefined) {
    throw new Error("useAnnouncements must be used within an AnnouncementsProvider")
  }
  return context
}
