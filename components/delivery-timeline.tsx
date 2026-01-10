"use client"

import {
  Clock,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeliveryStatus, DeliveryRequest } from "@/lib/delivery-context"

interface DeliveryTimelineProps {
  request: DeliveryRequest
  className?: string
}

interface TimelineStep {
  status: DeliveryStatus
  label: string
  icon: typeof Clock
  timestamp?: string
}

export function DeliveryTimeline({ request, className }: DeliveryTimelineProps) {
  // Define the standard delivery flow steps
  const steps: TimelineStep[] = [
    {
      status: "requested",
      label: "Request Submitted",
      icon: Clock,
      timestamp: request.createdAt,
    },
    {
      status: "printing",
      label: "ID Being Printed",
      icon: Printer,
      timestamp: request.sentToPrintAt,
    },
    {
      status: "printed",
      label: "ID Ready",
      icon: Package,
      timestamp: request.printedAt,
    },
    {
      status: "out_for_delivery",
      label: "Out for Delivery",
      icon: Truck,
      timestamp: request.outForDeliveryAt,
    },
    {
      status: "delivered",
      label: "Delivered",
      icon: CheckCircle2,
      timestamp: request.deliveredAt || request.deliveryConfirmedAt,
    },
  ]

  // Status order for comparison
  const statusOrder: DeliveryStatus[] = [
    "requested",
    "printing",
    "printed",
    "out_for_delivery",
    "delivered",
  ]

  const currentStatusIndex = statusOrder.indexOf(request.status)
  const isFailed = request.status === "delivery_failed"
  const isPickupRequired = request.status === "pickup_required"

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className={cn("relative", className)}>
      {/* Timeline container */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.status)
          const isCompleted = stepIndex < currentStatusIndex || (stepIndex === currentStatusIndex && request.status === "delivered")
          const isCurrent = stepIndex === currentStatusIndex && request.status !== "delivered"
          const isPending = stepIndex > currentStatusIndex
          const Icon = step.icon

          // Handle failed/pickup status
          const showFailedState = isFailed && stepIndex === currentStatusIndex
          const showPickupState = isPickupRequired && stepIndex === currentStatusIndex

          return (
            <div key={step.status} className="relative flex gap-4">
              {/* Vertical line connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)]",
                    isCompleted ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              )}

              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                  isCompleted && "bg-emerald-500 text-white",
                  isCurrent && !showFailedState && !showPickupState && "bg-blue-500 text-white ring-4 ring-blue-100",
                  showFailedState && "bg-red-500 text-white ring-4 ring-red-100",
                  showPickupState && "bg-orange-500 text-white ring-4 ring-orange-100",
                  isPending && "bg-gray-100 text-gray-400"
                )}
              >
                {showFailedState ? (
                  <XCircle className="h-4 w-4" />
                ) : showPickupState ? (
                  <MapPin className="h-4 w-4" />
                ) : (
                  <Icon className={cn("h-4 w-4", isCurrent && "animate-pulse")} />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "font-medium",
                      isCompleted && "text-emerald-600",
                      isCurrent && "text-blue-600",
                      showFailedState && "text-red-600",
                      showPickupState && "text-orange-600",
                      isPending && "text-gray-400"
                    )}
                  >
                    {showFailedState
                      ? "Delivery Failed"
                      : showPickupState
                      ? "Pickup Required"
                      : step.label}
                  </p>
                  {step.timestamp && (isCompleted || isCurrent) && (
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(step.timestamp)}
                    </span>
                  )}
                </div>

                {/* Additional info for current step */}
                {isCurrent && !showFailedState && !showPickupState && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.status === "requested" && "Your request is being processed."}
                    {step.status === "printing" && "Your ID card is being printed."}
                    {step.status === "printed" && "Your ID is ready for delivery."}
                    {step.status === "out_for_delivery" &&
                      "Your ID is on the way! Please be ready to receive it."}
                  </p>
                )}

                {/* Failed delivery info */}
                {showFailedState && request.failureReason && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">
                      {request.failureReason === "not_home" &&
                        "We tried to deliver but you were not home."}
                      {request.failureReason === "wrong_address" &&
                        "We could not find your address."}
                      {request.failureReason === "refused" &&
                        "The delivery was refused."}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Failed attempts: {request.failedAttempts}/2
                    </p>
                  </div>
                )}

                {/* Pickup required info */}
                {showPickupState && (
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">
                      After multiple delivery attempts, your ID is now available for pickup at
                      the barangay office.
                    </p>
                  </div>
                )}

                {/* Completed delivery info */}
                {step.status === "delivered" && isCompleted && (
                  <p className="text-sm text-emerald-600 mt-1">
                    Your ID has been delivered successfully!
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Compact horizontal timeline for cards/lists
interface DeliveryTimelineCompactProps {
  status: DeliveryStatus
  className?: string
}

export function DeliveryTimelineCompact({ status, className }: DeliveryTimelineCompactProps) {
  const statusOrder: DeliveryStatus[] = [
    "requested",
    "printing",
    "printed",
    "out_for_delivery",
    "delivered",
  ]

  const currentIndex = statusOrder.indexOf(status)
  const isFailed = status === "delivery_failed"
  const isPickupRequired = status === "pickup_required"

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {statusOrder.map((s, index) => {
        const isCompleted = index < currentIndex || (index === currentIndex && status === "delivered")
        const isCurrent = index === currentIndex && status !== "delivered"

        return (
          <div key={s} className="flex items-center">
            {/* Dot */}
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isCompleted && "bg-emerald-500",
                isCurrent && !isFailed && !isPickupRequired && "bg-blue-500",
                isCurrent && isFailed && "bg-red-500",
                isCurrent && isPickupRequired && "bg-orange-500",
                !isCompleted && !isCurrent && "bg-gray-200"
              )}
            />
            {/* Connector line */}
            {index < statusOrder.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5",
                  isCompleted ? "bg-emerald-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
