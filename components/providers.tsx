'use client'

import { AuthProvider } from "@/lib/auth-context"
import { ResidentsProvider } from "@/lib/residents-context"
import { PaymentProvider } from "@/lib/payment-context"
import { QRTProvider } from "@/lib/qrt-context"
import { CertificateProvider } from "@/lib/certificate-context"
import { BlotterProvider } from "@/lib/blotter-context"
import { AnnouncementsProvider } from "@/lib/announcements-context"
import { BayanihanProvider } from "@/lib/bayanihan-context"
import { DeliveryProvider } from "@/lib/delivery-context"
import { NotificationsProvider } from "@/lib/notifications-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ResidentsProvider>
        <PaymentProvider>
          <QRTProvider>
            <DeliveryProvider>
              <NotificationsProvider>
                <CertificateProvider>
                  <BlotterProvider>
                    <AnnouncementsProvider>
                      <BayanihanProvider>
                        {children}
                      </BayanihanProvider>
                    </AnnouncementsProvider>
                  </BlotterProvider>
                </CertificateProvider>
              </NotificationsProvider>
            </DeliveryProvider>
          </QRTProvider>
        </PaymentProvider>
      </ResidentsProvider>
    </AuthProvider>
  )
}
