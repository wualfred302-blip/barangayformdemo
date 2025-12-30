'use client'

import dynamic from 'next/dynamic'

// Dynamic import with ssr: false - this must be in a client component
const Providers = dynamic(() => import('./providers').then(mod => mod.Providers), {
  ssr: false,
  loading: () => null // Show nothing while loading to prevent hydration mismatch
})

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
