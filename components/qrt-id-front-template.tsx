import React from "react"
import Image from "next/image"

interface QRTIDFrontProps {
  qrtCode: string
  fullName: string
  birthDate: string
  address: string
  gender: string
  civilStatus: string
  birthPlace: string
  photoUrl: string
  issuedDate: string
}

export const QRTIDFrontTemplate = React.forwardRef<HTMLDivElement, QRTIDFrontProps>(
  ({ qrtCode, fullName, birthDate, address, gender, civilStatus, birthPlace, photoUrl, issuedDate }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[856px] h-[540px] bg-gradient-to-br from-blue-50 via-white to-pink-50 relative overflow-hidden"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Background Security Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#3b82f6_10px,#3b82f6_20px)]" />
        </div>

        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">🇵🇭</span>
              </div>
              <div>
                <div className="text-xs font-medium tracking-wider">REPUBLIKA NG PILIPINAS</div>
                <div className="text-sm font-bold">BARANGAY MAWAQUE</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs tracking-wider">QUICK RESPONSE TEAM</div>
              <div className="text-lg font-bold">QRT ID</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative px-8 py-6">
          <div className="flex gap-6">
            {/* Photo Section */}
            <div className="flex-shrink-0">
              <div className="w-[180px] h-[220px] border-4 border-blue-600 rounded-lg overflow-hidden bg-gray-100 relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Information Section */}
            <div className="flex-1 space-y-3">
              {/* QRT Code */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg">
                <div className="text-xs font-medium tracking-wider opacity-90">QRT CODE</div>
                <div className="text-2xl font-bold tracking-wide">{qrtCode}</div>
              </div>

              {/* Personal Information */}
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Full Name</div>
                  <div className="text-lg font-bold text-gray-900 uppercase">{fullName}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Date of Birth</div>
                    <div className="text-sm font-bold text-gray-900">{birthDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Gender</div>
                    <div className="text-sm font-bold text-gray-900">{gender}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Civil Status</div>
                    <div className="text-sm font-bold text-gray-900">{civilStatus}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Birth Place</div>
                    <div className="text-sm font-bold text-gray-900 truncate">{birthPlace}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Address</div>
                  <div className="text-sm font-bold text-gray-900">{address}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-8 py-3">
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold">Issued:</span> {issuedDate}
            </div>
            <div className="font-bold tracking-wider">BARANGAY MAWAQUE LINKOD</div>
            <div className="text-right">
              <div className="text-[10px] opacity-75">NOT VALID FOR</div>
              <div className="text-[10px] font-semibold">GOVERNMENT TRANSACTIONS</div>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-20 right-8 text-[120px] font-bold text-blue-600 opacity-5 rotate-[-15deg]">
          QRT
        </div>
      </div>
    )
  }
)

QRTIDFrontTemplate.displayName = "QRTIDFrontTemplate"
