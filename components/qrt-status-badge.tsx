"use client"

import {
  Clock,
  RefreshCw,
  CheckCircle2,
  Check,
  XCircle,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QRTStatusBadgeProps {
  status: "pending" | "processing" | "ready" | "issued" | "expired" | "rejected"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function QRTStatusBadge({ 
  status, 
  size = "md", 
  showIcon = true,
  className 
}: QRTStatusBadgeProps) {
  
  const statusConfig = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-orange-100 text-orange-600",
      iconClassName: ""
    },
    processing: {
      label: "Processing",
      icon: RefreshCw,
      className: "bg-blue-100 text-blue-600",
      iconClassName: "animate-spin"
    },
    ready: {
      label: "Ready",
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-600",
      iconClassName: ""
    },
    issued: {
      label: "Issued",
      icon: Check,
      className: "bg-emerald-100 text-emerald-600",
      iconClassName: ""
    },
    expired: {
      label: "Expired",
      icon: XCircle,
      className: "bg-red-100 text-red-600",
      iconClassName: ""
    },
    rejected: {
      label: "Rejected",
      icon: X,
      className: "bg-red-100 text-red-600",
      iconClassName: ""
    }
  }

  const sizeConfig = {
    sm: {
      badge: "text-xs px-2 py-0.5",
      icon: "h-3 w-3"
    },
    md: {
      badge: "text-xs px-3 py-1",
      icon: "h-4 w-4"
    },
    lg: {
      badge: "text-sm px-4 py-1.5",
      icon: "h-5 w-5"
    }
  }

  const config = statusConfig[status]
  const sizeClass = sizeConfig[size]
  const Icon = config.icon

  return (
    <span className={cn(
      "rounded-full font-medium inline-flex items-center gap-1.5",
      config.className,
      sizeClass.badge,
      className
    )}>
      {showIcon && (
        <Icon className={cn(sizeClass.icon, config.iconClassName)} />
      )}
      {config.label}
    </span>
  )
}
