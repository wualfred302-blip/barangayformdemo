"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  userId: string
  mobileNumber: string
  fullName: string
  email: string
  address: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean // Added loading state to prevent redirect race condition
  login: (userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Start with loading true

  useEffect(() => {
    const storedUser = localStorage.getItem("barangay_user")
    const storedAuth = localStorage.getItem("barangay_auth")

    if (storedUser && storedAuth === "true") {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setIsLoading(false) // Done checking
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem("barangay_user", JSON.stringify(userData))
    localStorage.setItem("barangay_auth", "true")
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("barangay_user")
    localStorage.removeItem("barangay_auth")
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
