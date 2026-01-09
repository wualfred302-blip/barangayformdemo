"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, memo, useCallback, useMemo } from "react"

export type UserRole = "resident" | "captain" | "secretary" | "treasurer"

interface User {
  id?: string
  fullName: string
  mobileNumber: string
  email: string
  address: string
  role?: UserRole
}

interface StaffUser {
  id: string
  fullName: string
  email: string
  role: "captain" | "secretary" | "treasurer"
}

interface AuthContextType {
  user: User | null
  staffUser: StaffUser | null
  isAuthenticated: boolean
  isStaffAuthenticated: boolean
  isLoading: boolean
  userRole: UserRole | null
  login: (userData: User) => void
  staffLogin: (staffData: StaffUser) => void
  logout: () => void
  staffLogout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = memo(({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // Load resident auth
      const storedUser = localStorage.getItem("barangay_user")
      const storedAuth = localStorage.getItem("barangay_auth")

      if (storedUser && storedAuth === "true") {
        try {
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Failed to parse resident user data:", error)
          localStorage.removeItem("barangay_user")
          localStorage.removeItem("barangay_auth")
          setUser(null)
          setIsAuthenticated(false)
        }
      }

      // Load staff auth
      const storedStaff = localStorage.getItem("barangay_staff")
      const storedStaffAuth = localStorage.getItem("barangay_staff_auth")

      if (storedStaff && storedStaffAuth === "true") {
        try {
          setStaffUser(JSON.parse(storedStaff))
          setIsStaffAuthenticated(true)
        } catch (error) {
          console.error("Failed to parse staff user data:", error)
          localStorage.removeItem("barangay_staff")
          localStorage.removeItem("barangay_staff_auth")
          setStaffUser(null)
          setIsStaffAuthenticated(false)
        }
      }

      setIsLoading(false)
    }
    load()
  }, [])

  // Debounced save for auth state
  useEffect(() => {
    if (isLoading) return

    const timer = setTimeout(() => {
      if (user && isAuthenticated) {
        localStorage.setItem("barangay_user", JSON.stringify(user))
        localStorage.setItem("barangay_auth", "true")
      } else {
        localStorage.removeItem("barangay_user")
        localStorage.removeItem("barangay_auth")
      }

      if (staffUser && isStaffAuthenticated) {
        localStorage.setItem("barangay_staff", JSON.stringify(staffUser))
        localStorage.setItem("barangay_staff_auth", "true")
      } else {
        localStorage.removeItem("barangay_staff")
        localStorage.removeItem("barangay_staff_auth")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [user, isAuthenticated, staffUser, isStaffAuthenticated, isLoading])

  const login = useCallback((userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const staffLogin = useCallback((staffData: StaffUser) => {
    setStaffUser(staffData)
    setIsStaffAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("barangay_user")
    localStorage.removeItem("barangay_auth")
  }, [])

  const staffLogout = useCallback(() => {
    setStaffUser(null)
    setIsStaffAuthenticated(false)
    localStorage.removeItem("barangay_staff")
    localStorage.removeItem("barangay_staff_auth")
  }, [])

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null))
  }, [])

  const userRole: UserRole | null = staffUser?.role || user?.role || null

  const value = useMemo(
    () => ({
      user,
      staffUser,
      isAuthenticated,
      isStaffAuthenticated,
      isLoading,
      userRole,
      login,
      staffLogin,
      logout,
      staffLogout,
      updateUser,
    }),
    [
      user,
      staffUser,
      isAuthenticated,
      isStaffAuthenticated,
      isLoading,
      userRole,
      login,
      staffLogin,
      logout,
      staffLogout,
      updateUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
})

export function useAuth() {
  const context = useContext(AuthContext)
  // Return safe defaults during SSR/prerendering instead of throwing
  if (context === undefined) {
    return {
      user: null,
      staffUser: null,
      isAuthenticated: false,
      isStaffAuthenticated: false,
      isLoading: true,
      userRole: null,
      login: () => {},
      staffLogin: () => {},
      logout: () => {},
      staffLogout: () => {},
      updateUser: () => {},
    } as AuthContextType
  }
  return context
}
