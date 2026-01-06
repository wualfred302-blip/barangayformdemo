import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let clientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // Return existing instance if already created
  if (clientInstance) {
    return clientInstance
  }

  // Only run in browser environment to avoid SSR issues
  if (typeof window === 'undefined') {
    console.warn("[Supabase Client] Attempted to create client on server side")
    // Return a mock client that won't break the app
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseUrl.trim()) {
      const errorMessage = "NEXT_PUBLIC_SUPABASE_URL is missing or empty"
      console.error("[Supabase Client] Configuration error:", errorMessage)
      throw new Error("Supabase env vars missing: " + errorMessage)
    }

    if (!supabaseAnonKey || !supabaseAnonKey.trim()) {
      const errorMessage = "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty"
      console.error("[Supabase Client] Configuration error:", errorMessage)
      throw new Error("Supabase env vars missing: " + errorMessage)
    }

    clientInstance = createSupabaseClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        db: {
          schema: "public",
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    )

    return clientInstance
  } catch (error) {
    console.error("[Supabase Client] Failed to create client:", error)
    // Return a mock client to prevent app crashes
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key')
  }
}

export function resetSupabaseClient() {
  clientInstance = null
}
