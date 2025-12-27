import React from "react"

interface QRTIDBackProps {
  qrtCode: string
  height: string
  weight: string
  yearsResident: number
  citizenship: string
  emergencyContactName: string
  emergencyContactAddress: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  qrCodeDataUrl: string
  issuedDate: string
  expiryDate: string
}

export const QRTIDBackTemplate = React.forwardRef<HTMLDivElement, QRTIDBackProps>(
  (
    {
      qrtCode,
      height,
      weight,
      yearsResident,
      citizenship,
      emergencyContactName,
      emergencyContactAddress,
      emergencyContactPhone,
      emergencyContactRelationship,
      qrCodeDataUrl,
      issuedDate,
      expiryDate,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="w-[856px] h-[540px] bg-gradient-to-br from-pink-50 via-white to-blue-50 relative overflow-hidden"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Background Security Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,#ec4899_10px,#ec4899_20px)]" />
        </div>

        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium tracking-wider">QUICK RESPONSE TEAM</div>
              <div className="text-lg font-bold">EMERGENCY INFORMATION</div>
            </div>
            <div className="text-right">
              <div className="text-xs tracking-wider opacity-90">QRT CODE</div>
              <div className="text-sm font-bold">{qrtCode}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative px-8 py-6 space-y-5">
          {/* Physical Information */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
            <div className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">
              Physical Information
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Height</div>
                <div className="text-sm font-bold text-gray-900">{height}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Weight</div>
                <div className="text-sm font-bold text-gray-900">{weight}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Years Resident</div>
                <div className="text-sm font-bold text-gray-900">{yearsResident} years</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Citizenship</div>
                <div className="text-sm font-bold text-gray-900">{citizenship}</div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm font-bold text-red-800 uppercase tracking-wide">
                Emergency Contact
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Name</div>
                <div className="text-sm font-bold text-gray-900">{emergencyContactName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Relationship</div>
                <div className="text-sm font-bold text-gray-900">{emergencyContactRelationship}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Phone</div>
                <div className="text-sm font-bold text-gray-900">{emergencyContactPhone}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-semibold uppercase">Address</div>
                <div className="text-sm font-bold text-gray-900">{emergencyContactAddress}</div>
              </div>
            </div>
          </div>

          {/* QR Code and Validity */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Issued Date</div>
                <div className="text-sm font-bold text-gray-900">{issuedDate}</div>
              </div>
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Expiry Date</div>
                <div className="text-sm font-bold text-gray-900">{expiryDate}</div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white border-4 border-blue-600 rounded-lg p-3">
              <div className="text-xs text-center font-bold text-blue-800 mb-2 uppercase">
                Scan to Verify
              </div>
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-[180px] h-[180px]" />
              ) : (
                <div className="w-[180px] h-[180px] bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">QR Code</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-8 py-3">
          <div className="flex justify-between items-center text-xs">
            <div>
              <div className="text-[10px] opacity-75">Authorized by:</div>
              <div className="font-semibold">Punong Barangay, Barangay Mawaque</div>
            </div>
            <div className="text-center">
              <div className="font-bold tracking-wider">BARANGAY QRT ID SYSTEM</div>
              <div className="text-[10px] opacity-75">For emergency response purposes only</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] opacity-75">Report lost ID to:</div>
              <div className="font-semibold">Barangay Hall</div>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[140px] font-bold text-pink-600 opacity-5 rotate-[15deg]">
          MAWAQUE
        </div>
      </div>
    )
  }
)

QRTIDBackTemplate.displayName = "QRTIDBackTemplate"
