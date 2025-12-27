"use client"

import React, { createContext, useContext, useEffect, useState, memo, useCallback, useMemo } from "react"
import { PaymentTransaction } from "./payment-utils"

interface PaymentContextType {
  payments: PaymentTransaction[]
  addPayment: (payment: PaymentTransaction) => void
  getPayments: () => PaymentTransaction[]
  getPaymentByCertificate: (certId: string) => PaymentTransaction | undefined
  getPaymentByQRTId: (qrtId: string) => PaymentTransaction | undefined
  updatePaymentStatus: (id: string, status: "pending" | "success" | "failed") => void
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export const PaymentProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const load = async () => {
      const savedPayments = localStorage.getItem("barangay_payments")
      if (savedPayments) {
        try {
          setPayments(JSON.parse(savedPayments))
        } catch (e) {
          console.error("Failed to parse stored payments:", e)
          localStorage.removeItem("barangay_payments")
          setPayments([])
        }
      }
      setIsInitialized(true)
    }
    load()
  }, [])

  // Debounced save
  useEffect(() => {
    if (!isInitialized || payments.length === 0) return
    const timeout = setTimeout(() => {
      localStorage.setItem("barangay_payments", JSON.stringify(payments, null, 0))
    }, 1000)
    return () => clearTimeout(timeout)
  }, [payments, isInitialized])

  const addPayment = useCallback((payment: PaymentTransaction) => {
    setPayments(prev => [payment, ...prev])
  }, [])

  const getPayments = useCallback(() => {
    return payments
  }, [payments])

  const getPaymentByCertificate = useCallback((certId: string) => {
    return payments.find((p) => p.certificateId === certId)
  }, [payments])

  const getPaymentByQRTId = useCallback((qrtId: string) => {
    return payments.find((p) => p.qrtIdId === qrtId)
  }, [payments])

  const updatePaymentStatus = useCallback((id: string, status: "pending" | "success" | "failed") => {
    setPayments(prev => prev.map((p) =>
      p.id === id ? { ...p, status, completedAt: status === "success" ? new Date().toISOString() : p.completedAt } : p
    ))
  }, [])

  const value = useMemo(() => ({
    payments,
    addPayment,
    getPayments,
    getPaymentByCertificate,
    getPaymentByQRTId,
    updatePaymentStatus,
  }), [
    payments,
    addPayment,
    getPayments,
    getPaymentByCertificate,
    getPaymentByQRTId,
    updatePaymentStatus,
  ])

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  )
})

export function usePayment() {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider")
  }
  return context
}
