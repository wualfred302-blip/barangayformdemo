"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, ShieldCheck, Calendar, User, FileText, MapPin, Download } from "lucide-react"
import { verifySignatureHash } from "@/lib/signature-utils"
import { type CertificateRequest } from "@/lib/certificate-context"
import Loading from "./loading"

// Helper to get certificate from localStorage since API is mock
function getCertificateFromStorage(serial: string): CertificateRequest | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem("barangay_certificates")
    if (!stored) return null
    const certificates: CertificateRequest[] = JSON.parse(stored)
    return certificates.find(c => c.serialNumber === serial) || null
  } catch (e) {
    console.error("Error reading storage", e)
    return null
  }
}

function VerifyContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const serial = params.serial as string
  const urlHash = searchParams.get("signatureHash")

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "tampered" | "unsigned">("loading")
  const [certificate, setCertificate] = useState<CertificateRequest | null>(null)
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)

  useEffect(() => {
    async function verify() {
      if (!serial) {
        setStatus("invalid")
        return
      }

      try {
        // 1. Try API first (as per plan)
        let apiData = null
        try {
          const res = await fetch(`/api/verify/${serial}`)
          if (res.ok) {
            apiData = await res.json()
          }
        } catch (e) {
          // API error, ignore and fall back
        }

        // 2. Check LocalStorage (Fallback for Demo)
        const localCert = getCertificateFromStorage(serial)
        
        const cert = (apiData?.valid && apiData.certificate) ? apiData.certificate : localCert

        if (!cert) {
          setStatus("invalid")
          return
        }

        setCertificate(cert)
        setVerifiedAt(new Date().toISOString())

        // 3. Verify Signature
        if (!cert.staffSignature) {
          setStatus("unsigned")
        } else {
            // Verify hash if provided in URL, otherwise just mark as valid signed
            if (urlHash) {
                const isValid = await verifySignatureHash(cert.staffSignature, urlHash)
                setStatus(isValid ? "valid" : "tampered")
            } else {
                setStatus("valid")
            }
        }

      } catch (error) {
        console.error("Verification error", error)
        setStatus("invalid")
      }
    }

    verify()
  }, [serial, urlHash])

  if (status === "loading") return <Loading />

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href="/" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Verification</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pb-6 pt-5">
        {/* Status Card */}
        <Card className={`mb-6 border-0 shadow-sm ${
          status === "valid" ? "bg-emerald-50" : 
          status === "invalid" || status === "tampered" ? "bg-red-50" : 
          "bg-amber-50"
        }`}>
          <CardContent className="flex flex-col items-center p-8 text-center">
            {status === "valid" && (
              <>
                <div className="mb-4 rounded-full bg-emerald-100 p-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-emerald-900">Valid Certificate</h2>
                <p className="text-emerald-700">This certificate is authentic and has been digitally signed.</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified on {verifiedAt ? new Date(verifiedAt).toLocaleString() : ""}</span>
                </div>
              </>
            )}

            {status === "invalid" && (
              <>
                <div className="mb-4 rounded-full bg-red-100 p-3">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-red-900">Certificate Not Found</h2>
                <p className="text-red-700">This certificate serial number does not exist in our records.</p>
              </>
            )}

            {status === "tampered" && (
              <>
                <div className="mb-4 rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-red-900">Verification Failed</h2>
                <p className="text-red-700">The digital signature does not match the record. This certificate may have been tampered with.</p>
              </>
            )}

            {status === "unsigned" && (
              <>
                <div className="mb-4 rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-amber-900">Unsigned Certificate</h2>
                <p className="text-amber-700">This certificate exists but has not been digitally signed yet.</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Certificate Details */}
        {certificate && (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Certificate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Certificate Type</p>
                  <p className="font-medium text-gray-900">{certificate.certificateType}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Issued To</p>
                  <p className="font-medium text-gray-900">{certificate.residentName || "JUAN DELA CRUZ"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Issued Date</p>
                  <p className="font-medium text-gray-900">
                    {certificate.readyAt ? new Date(certificate.readyAt).toLocaleDateString() : "Pending"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">Barangay Mawaque, Mabalacat</p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Signed By</p>
                <div className="flex items-center gap-3">
                   {certificate.staffSignature ? (
                      <div className="h-12 w-24 relative">
                        <img src={certificate.staffSignature} alt="Signature" className="h-full w-full object-contain object-left" />
                      </div>
                   ) : (
                     <div className="h-12 w-24 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                       No Signature
                     </div>
                   )}
                   <div>
                     <p className="font-bold text-gray-900">{certificate.signedBy || "Unknown"}</p>
                     <p className="text-xs text-gray-500">{certificate.signedByRole || "Official"}</p>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Loading />}>
        <VerifyContent />
    </Suspense>
  )
}
