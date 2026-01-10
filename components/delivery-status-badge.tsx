"use client"

import {
  Clock,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeliveryStatus } from "@/lib/delivery-context"

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function DeliveryStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: DeliveryStatusBadgeProps) {
  const statusConfig: Record<
    DeliveryStatus,
    {
      label: string
      icon: typeof Clock
      className: string
      iconClassName: string
    }
  > = {
    requested: {
      label: "Requested",
      icon: Clock,
      className: "bg-blue-100 text-blue-600",
      iconClassName: "",
    },
    printing: {
      label: "Printing",
      icon: Printer,
      className: "bg-purple-100 text-purple-600",
      iconClassName: "animate-pulse",
    },
    printed: {
      label: "Printed",
      icon: Package,
      className: "bg-indigo-100 text-indigo-600",
      iconClassName: "",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      icon: Truck,
      className: "bg-amber-100 text-amber-600",
      iconClassName: "animate-bounce",
    },
    delivered: {
      label: "Delivered",
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-600",
      iconClassName: "",
    },
    delivery_failed: {
      label: "Delivery Failed",
      icon: XCircle,
      className: "bg-red-100 text-red-600",
      iconClassName: "",
    },
    pickup_required: {
      label: "Pickup Required",
      icon: MapPin,
      className: "bg-orange-100 text-orange-600",
      iconClassName: "",
    },
  }

  const sizeConfig = {
    sm: {
      badge: "text-xs px-2 py-0.5",
      icon: "h-3 w-3",
    },
    md: {
      badge: "text-xs px-3 py-1",
      icon: "h-4 w-4",
    },
    lg: {
      badge: "text-sm px-4 py-1.5",
      icon: "h-5 w-5",
    },
  }

  const config = statusConfig[status]
  const sizeClass = sizeConfig[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "rounded-full font-medium inline-flex items-center gap-1.5",
        config.className,
        sizeClass.badge,
        className
      )}
    >
      {showIcon && <Icon className={cn(sizeClass.icon, config.iconClassName)} />}
      {config.label}
    </span>
  )
}

// Helper component to show status with failure reason
interface DeliveryStatusWithReasonProps extends DeliveryStatusBadgeProps {
  failureReason?: "not_home" | "wrong_address" | "refused"
}

export function DeliveryStatusWithReason({
  status,
  failureReason,
  ...props
}: DeliveryStatusWithReasonProps) {
  if (status !== "delivery_failed" || !failureReason) {
    return <DeliveryStatusBadge status={status} {...props} />
  }

  const reasonLabels: Record<string, string> = {
    not_home: "Not Home",
    wrong_address: "Wrong Address",
    refused: "Refused",
  }

  return (
    <div className="flex flex-col gap-1">
      <DeliveryStatusBadge status={status} {...props} />
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {reasonLabels[failureReason]}
      </span>
    </div>
  )
}
